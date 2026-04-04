"""
Minimal health check endpoint for Vercel Python runtime testing.
This validates that the Python serverless environment is working.
"""

def handler(request):
    """Simple HTTP handler for Vercel serverless."""
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": '{"status": "healthy", "service": "Market Microstructure API"}',
    }
