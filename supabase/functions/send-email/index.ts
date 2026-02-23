// Supabase Edge Function: send-email
// Sends approval emails to recruiters using Resend API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  to: string
  subject: string
  html: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { to, subject, html }: EmailRequest = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // If Resend API key is configured, use Resend
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SkillMirror <noreply@skillmirror.ai>',
          to: [to],
          subject: subject,
          html: html,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Resend API error:', data)
        throw new Error(data.message || 'Failed to send email via Resend')
      }

      console.log('Email sent successfully via Resend:', data)
      
      return new Response(
        JSON.stringify({ success: true, id: data.id, provider: 'resend' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Fallback: Log email for development (no API key configured)
    console.log('='.repeat(60))
    console.log('EMAIL (Development Mode - No API Key)')
    console.log('='.repeat(60))
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('HTML Length:', html.length, 'characters')
    console.log('='.repeat(60))

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email logged (development mode - configure RESEND_API_KEY for production)',
        provider: 'console'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Send email error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
