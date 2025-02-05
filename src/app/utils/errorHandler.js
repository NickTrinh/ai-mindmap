import { NextResponse } from 'next/server';

export const handleApiError = (error, customMessage) => {
  console.error(`${customMessage}:`, error);
  return NextResponse.json({ error: customMessage }, { status: 500 });
};

export const handleNotFound = resource => {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
};

export const handleValidationError = message => {
  return NextResponse.json({ error: message }, { status: 400 });
};
