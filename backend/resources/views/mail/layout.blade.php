<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name') }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #18181b;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 24px 16px;
        }
        .header {
            text-align: center;
            padding: 32px 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #18181b;
        }
        .content {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
        }
        .footer {
            text-align: center;
            padding: 24px 0;
            font-size: 13px;
            color: #71717a;
        }
        .button {
            display: inline-block;
            background-color: #18181b;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
        }
        .button:hover {
            background-color: #27272a;
        }
        hr {
            border: none;
            border-top: 1px solid #e4e4e7;
            margin: 24px 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
        </div>

        <div class="content">
            {{ $slot }}
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>{{ config('app.url') }}</p>
        </div>
    </div>
</body>
</html>
