<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0D2747 0%, #2563EB 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SICSS</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Salvation In Christ School System</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #0D2747; margin-top: 0;">Your Login Verification Code</h2>
            
            <p>Hello {{ $userName }},</p>
            
            <p>You are attempting to log in to the SICSS Management System. To complete your login, please use the following verification code:</p>
            
            <div style="background: #f8f9fa; border: 2px dashed #2563EB; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: bold; color: #2563EB; letter-spacing: 5px;">{{ $code }}</span>
            </div>
            
            <p style="color: #666; font-size: 14px;">
                <strong>Important:</strong>
            </p>
            <ul style="color: #666; font-size: 14px;">
                <li>This code will expire in <strong>10 minutes</strong></li>
                <li>Do not share this code with anyone</li>
                <li>If you did not request this code, please ignore this email</li>
            </ul>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you have any questions or concerns, please contact the school administration.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
                <p>This is an automated message from SICSS Management System.</p>
                <p>© {{ date('Y') }} Salvation In Christ School System. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
