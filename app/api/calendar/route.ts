import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, location, description, startTime, endTime } = await req.json();

    // 1. Authenticate with Google securely using your backend keys
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 2. Format the event data
    const event = {
      summary: title,
      location: location,
      description: description,
      start: { 
        dateTime: startTime, 
        timeZone: 'Asia/Kolkata' // Hardcoded to your timezone
      }, 
      end: { 
        dateTime: endTime, 
        timeZone: 'Asia/Kolkata' 
      },
    };

    // 3. Inject the event into your primary Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return NextResponse.json({ success: true, link: response.data.htmlLink });
  } catch (error) {
    console.error('Google Calendar Error:', error);
    return NextResponse.json({ error: 'Failed to sync with Google Calendar' }, { status: 500 });
  }
}