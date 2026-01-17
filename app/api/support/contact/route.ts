import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@server/services/email.service';
import { contactFormSchema } from '@shared/validation/support.schema';
import { serverEnv } from '@shared/config/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = contactFormSchema.parse(body);

    // Get userId if user is authenticated (optional for support form)
    const userId = request.headers.get('X-User-Id');

    const emailService = getEmailService();

    // Send support request email to the support team
    await emailService.send({
      to: serverEnv.SUPPORT_EMAIL,
      template: 'support-request',
      data: {
        name: validatedData.name,
        email: validatedData.email,
        category: validatedData.category,
        subject: validatedData.subject,
        message: validatedData.message,
      },
      type: 'transactional',
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Your support request has been submitted. We will get back to you within 24 hours.',
    });
  } catch (error) {
    console.error('Support contact form error:', error);

    if (error instanceof Error && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid form data',
          error: 'Validation failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit support request. Please try again.',
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
