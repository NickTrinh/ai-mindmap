export const handleApiError = (error, customMessage) => {
  console.error(`${customMessage}:`, error);
  return NextResponse.json({ error: customMessage }, { status: 500 });
};
