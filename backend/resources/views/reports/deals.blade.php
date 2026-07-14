<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Deals Report</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            margin-bottom: 25px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        .header h1 {
            font-size: 24px;
            color: #1e3a8a;
            margin: 0 0 5px 0;
        }
        .header-meta {
            color: #666;
            font-size: 11px;
        }
        .summary-boxes {
            margin-bottom: 25px;
            width: 100%;
        }
        .summary-box {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 12px;
            border-radius: 4px;
            width: 45%;
            display: inline-block;
        }
        .summary-box-right {
            float: right;
        }
        .summary-title {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background-color: #f9fafb;
            color: #374151;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
        }
        tr:nth-child(even) {
            background-color: #fcfcfc;
        }
        .badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 500;
            text-align: center;
        }
        .badge-won {
            background-color: #d1fae5;
            color: #065f46;
        }
        .badge-lost {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .badge-other {
            background-color: #fef3c7;
            color: #92400e;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Mini CRM - Deals Report</h1>
        <div class="header-meta">
            Exported on: {{ $exportedAt }} | Exported by: {{ $exportedBy }}
        </div>
    </div>

    <div class="summary-boxes">
        <div class="summary-box">
            <div class="summary-title">Total Deals Value</div>
            <div class="summary-value">₹{{ number_format($totalAmount, 2) }}</div>
        </div>
        <div class="summary-box summary-box-right">
            <div class="summary-title">Total Revenue (Won Deals)</div>
            <div class="summary-value" style="color: #059669;">₹{{ number_format($wonAmount, 2) }}</div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Deal Title</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Stage</th>
                <th>Assigned To</th>
                <th>Closing Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($deals as $deal)
            <tr>
                <td style="font-weight: 500;">{{ $deal->title }}</td>
                <td>{{ $deal->customer ? $deal->customer->name : 'N/A' }}</td>
                <td>₹{{ number_format($deal->amount, 2) }}</td>
                <td>
                    @if($deal->stage === 'Won')
                        <span class="badge badge-won">Won</span>
                    @elseif($deal->stage === 'Lost')
                        <span class="badge badge-lost">Lost</span>
                    @else
                        <span class="badge badge-other">{{ $deal->stage }}</span>
                    @endif
                </td>
                <td>{{ $deal->assignedTo ? $deal->assignedTo->name : 'N/A' }}</td>
                <td>{{ $deal->closing_date ?? 'N/A' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Mini CRM System &copy; {{ date('Y') }}. Confidential.
    </div>
</body>
</html>
