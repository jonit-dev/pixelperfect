import { NextRequest, NextResponse } from 'next/server';
import { getEmailService, EmailError } from '@server/services/email.service';
import { sendEmailSchema } from '@shared/validation/email.schema';
import { getAuthenticatedUser } from '@server/middleware/getAuthenticatedUser';
import { requireAdmin } from '@server/middleware/requireAdmin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Only admins can send arbitrary emails
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const adminCheck = await requireAdmin(request);
    if ('error' in adminCheck && adminCheck.error) {
      return adminCheck.error;
    }

    const body = await request.json();
    const validated = sendEmailSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const emailService = getEmailService();
    const result = await emailService.send({
      to: validated.data.to,
      template: validated.data.template,
      data: validated.data.data,
      type: validated.data.type,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EmailError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 500 }
      );
    }

    console.error('Email send error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SEND_FAILED', message: 'Failed to send email' } },
      { status: 500 }
    );
  }
}
