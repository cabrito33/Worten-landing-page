import { Resend } from 'resend';
import type { PropostaRecord } from './firebaseAdmin.ts';

export interface SendProposalEmailParams {
  proposta: PropostaRecord;
  propostaUrl: string;
  resumoIA: string;
}

export async function sendProposalNotificationEmail(params: SendProposalEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { proposta, propostaUrl, resumoIA } = params;
  const rawKey = process.env.RESEND_API_KEY;
  // Extrai apenas o token de API (re_...) eliminando espaços, quebras de linha ou texto adicional colado por engano
  const apiKey = (rawKey || '').trim().split(/\s+/)[0];
  const emailAluno = process.env.EMAIL_ALUNO || 'afonso06pedro@gmail.com';

  console.log(`[Resend Notification] A preparar notificação para o aluno: ${emailAluno}`);
  console.log(`[Resend Notification] Link da proposta gerada: ${propostaUrl}`);

  // Validação estrita: RESEND_API_KEY deve existir e começar por 're_'
  if (!apiKey || !apiKey.startsWith('re_')) {
    console.warn(
      `[Resend Aviso] RESEND_API_KEY não configurada ou inválida. Notificação por email ignorada sem quebrar a criação da proposta nem o retorno para a página /proposta/:token. Destinatário: ${emailAluno}.`
    );
    return {
      success: false,
      error: 'RESEND_API_KEY não configurada ou inválida (não começa por re_)',
    };
  }

  try {
    const resend = new Resend(apiKey);
    const subtotalFormatted = (proposta.totalSemIvaCentimos / 100).toFixed(2);
    const totalComIvaFormatted = (proposta.totalComIvaCentimos / 100).toFixed(2);

    const itemsHtml = proposta.itens
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #f1f1f1;">
          <td style="padding: 10px 12px; font-weight: 500;">${item.nome}</td>
          <td style="padding: 10px 12px; text-align: center;">${item.quantidade}</td>
          <td style="padding: 10px 12px; text-align: right;">${(item.precoUnitarioCentimos / 100).toFixed(2)} €</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 600;">${(item.totalItemCentimos / 100).toFixed(2)} €</td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header Worten Resolve -->
        <div style="background-color: #DE001A; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px;">WORTEN RESOLVE</h1>
          <p style="color: #ffe4e6; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Notificação Interna de Nova Proposta Gerada por IA</p>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #f8fafc; border-left: 4px solid #DE001A; padding: 14px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: bold;">
              Proposta Nº: ${proposta.numeroProposta}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
              Validade: 15 dias (até ${new Date(proposta.dataValidade).toLocaleDateString('pt-PT')})
            </p>
          </div>

          <h2 style="font-size: 16px; color: #0f172a; margin-top: 0;">Dados do Pedido:</h2>
          <ul style="font-size: 14px; color: #334155; line-height: 1.6; padding-left: 20px; margin: 8px 0 20px 0;">
            <li><strong>Cliente:</strong> ${proposta.clienteNome}</li>
            <li><strong>Email:</strong> ${proposta.clienteEmail}</li>
            <li><strong>Resumo IA:</strong> ${resumoIA}</li>
          </ul>

          <h3 style="font-size: 15px; color: #0f172a; margin-bottom: 8px;">Itens Orçamentados (Preços do Firestore):</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left; font-size: 12px; color: #475569;">
                <th style="padding: 8px 12px;">Serviço</th>
                <th style="padding: 8px 12px; text-align: center;">Qtd</th>
                <th style="padding: 8px 12px; text-align: right;">Unitário s/ IVA</th>
                <th style="padding: 8px 12px; text-align: right;">Total s/ IVA</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px 12px; text-align: right; font-weight: 600;">Total sem IVA:</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #0f172a;">${subtotalFormatted} €</td>
              </tr>
              <tr style="background-color: #fff1f2; color: #DE001A;">
                <td colspan="3" style="padding: 10px 12px; text-align: right; font-weight: bold; font-size: 14px;">Total com IVA (23%):</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: bold; font-size: 16px;">${totalComIvaFormatted} €</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${propostaUrl}" style="background-color: #DE001A; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(222, 0, 26, 0.3);">
              Ver Proposta Completa &rarr;
            </a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 12px 0 0 0;">
            Link direto: <a href="${propostaUrl}" style="color: #64748b;">${propostaUrl}</a>
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            Este email é uma notificação estritamente interna de aula para o aluno (${emailAluno}). O cliente final não foi notificado.
          </p>
        </div>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'Worten Resolve <onboarding@resend.dev>',
      to: [emailAluno],
      subject: `[Worten Resolve] Nova Proposta #${proposta.numeroProposta} Gerada por IA`,
      html: htmlContent,
    });

    if (data.error) {
      console.warn('[Resend Aviso] Resend retornou erro:', data.error.message || data.error);
      return {
        success: false,
        error: data.error.message,
      };
    }

    console.log('[Resend Notification] Email enviado com sucesso via Resend! ID:', data.data?.id);
    return {
      success: true,
      messageId: data.data?.id,
    };
  } catch (error: any) {
    console.error('[Resend Notification] Erro ao enviar email via Resend:', error);
    return {
      success: false,
      error: error?.message || 'Erro no envio do email Resend',
    };
  }
}
