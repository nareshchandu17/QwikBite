export async function GET() {
  return new Response(JSON.stringify({ message: 'CSS test endpoint' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}