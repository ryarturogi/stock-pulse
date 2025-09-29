/**
 * Simple SSE Test Endpoint
 * For debugging Server-Sent Events issues
 */

export async function GET() {
  // Create a simple SSE stream for testing
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let counter = 0;

      const sendEvent = (data: Record<string, unknown>) => {
        try {
          const eventData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        } catch (error) {
          console.error('Error sending test event:', error);
          controller.close();
        }
      };

      // Send initial message
      sendEvent({
        type: 'connected',
        message: 'SSE test connection established',
        timestamp: Date.now()
      });

      // Send a few test messages
      const interval = setInterval(() => {
        counter++;
        sendEvent({
          type: 'test',
          message: `Test message ${counter}`,
          timestamp: Date.now()
        });

        if (counter >= 3) {
          clearInterval(interval);
          sendEvent({
            type: 'complete',
            message: 'Test complete',
            timestamp: Date.now()
          });
          controller.close();
        }
      }, 1000);

      // Cleanup on client disconnect
      return () => {
        clearInterval(interval);
        controller.close();
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}