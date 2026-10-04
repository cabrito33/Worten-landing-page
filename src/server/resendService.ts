import { Resend } from 'resend';
import type { PropostaRecord } from './firebaseAdmin.ts';

export interface SendProposalEmailParams {
  proposta: PropostaRecord;
  propostaUrl: string;
  resumoIA: string;
}

export interface SendProposalEmailResult {
  success: boolean;
  status: 'enviada' | 'erro' | 'nao_configurado';
  messageId?: string;
  dataEnvio?: string;
  error?: string;
}

export async function sendProposalNotificationEmail(
  params: SendProposalEmailParams
): Promise<SendProposalEmailResult> {
  const { proposta, propostaUrl, resumoIA } = params;
  const rawKey = process.env.RESEND_API_KEY;
  // Extrai apenas o token de API (re_...) eliminando espaços ou texto colado por engano
  const apiKey = (rawKey || '').trim().split(/\s+/)[0];
  const emailAluno = process.env.EMAIL_ALUNO?.trim() || '';

  // Verificação de configuração: se faltar RESEND_API_KEY válida ou EMAIL_ALUNO
  if (!apiKey || !apiKey.startsWith('re_') || !emailAluno) {
    const motivo = !emailAluno
      ? 'EMAIL_ALUNO não está configurado nas variáveis de ambiente'
      : 'RESEND_API_KEY não configurada ou inválida (deve começar por re_)';

    console.warn(
      `[Resend Aviso] Notificação por email não enviada: ${motivo}. A criação da proposta e o link continuam operacionais.`
    );

    return {
      success: false,
      status: 'nao_configurado',
      error: motivo,
    };
  }

  console.log(`[Resend Notification] A preparar notificação para o aluno: ${emailAluno}`);
  console.log(`[Resend Notification] Link da proposta gerada: ${propostaUrl}`);

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
              Proposta #${proposta.numeroProposta}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
              Cliente: <strong>${proposta.clienteNome}</strong>
            </p>
          </div>

          <h3 style="color: #0f172a; font-size: 15px; margin: 0 0 10px 0;">Resumo da Interpretação Técnica:</h3>
          <p style="font-size: 13px; color: #475569; background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 0 0 20px 0; line-height: 1.5;">
            ${resumoIA || proposta.interpretacaoResumo || 'Sem observações adicionais.'}
          </p>

          <h3 style="color: #0f172a; font-size: 15px; margin: 0 0 10px 0;">Serviços Orçamentados:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left; color: #64748b;">
                <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0;">Serviço</th>
                <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0; text-align: center;">Qtd</th>
                <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0; text-align: right;">Unit.</th>
                <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px 12px; text-align: right; color: #64748b;">Subtotal (s/ IVA):</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: bold;">${subtotalFormatted} €</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td colspan="3" style="padding: 10px 12px; text-align: right; font-weight: bold; font-size: 14px;">Total com IVA (23%):</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: bold; font-size: 16px; color: #DE001A;">${totalComIvaFormatted} €</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align: center; margin: 28px 0 12px 0;">
            <a href="${propostaUrl}" style="background-color: #DE001A; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(222, 0, 26, 0.3);">
              Consultar Proposta no Navegador
            </a>
          </div>

          <p style="text-align: center; font-size: 11px; color: #94a3b8; margin: 12px 0 0 0;">
            Validade da proposta: 15 dias. Token: ${proposta.token}
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            Este email é uma notificação estritamente interna de avaliação para o aluno. O cliente final não foi notificado.
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
        status: 'erro',
        error: data.error.message || 'Erro devolvido pela API Resend',
      };
    }

    const messageId = data.data?.id;
    const dataEnvio = new Date().toISOString();
    console.log('[Resend Notification] Email aceite pela API Resend! ID:', messageId);
    return {
      success: true,
      status: 'enviada',
      messageId,
      dataEnvio,
    };
  } catch (error: any) {
    console.error('[Resend Notification] Erro ao enviar email via Resend:', error);
    return {
      success: false,
      status: 'erro',
      error: error?.message || 'Erro inesperado no envio Resend',
    };
  }
}
