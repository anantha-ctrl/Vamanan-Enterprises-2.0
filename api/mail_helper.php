<?php
/**
 * Vamanan Gold - Advanced SMTP Mailer Helper
 * Uses PHPMailer for secure, authenticated email delivery via Gmail SMTP.
 */

// Use PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Path to PHPMailer files
$phpmailer_path = __DIR__ . '/vendor/phpmailer/phpmailer/src/';

if (file_exists($phpmailer_path . 'PHPMailer.php')) {
    require_once $phpmailer_path . 'Exception.php';
    require_once $phpmailer_path . 'PHPMailer.php';
    require_once $phpmailer_path . 'SMTP.php';
    $use_phpmailer = true;
} else {
    $use_phpmailer = false;
}

function sendOTPMail($to_email, $otp) {
    global $use_phpmailer;
    
    // Always log the OTP for local development
    file_put_contents(__DIR__ . '/mail_log.txt', "[" . date('Y-m-d H:i:s') . "] TO: $to_email | OTP: $otp\n", FILE_APPEND);

    if (!$use_phpmailer) {
        return true; // Return true so flow continues even without real mail
    }

    // Load secure credentials
    $config = require __DIR__ . '/config/mail_config.php';
    
    $mail = new PHPMailer(true);

    try {
        // --- Server Settings ---
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Uncomment for debugging
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $config['smtp_port'];

        // --- Recipients ---
        $mail->setFrom($config['from_email'], $config['from_name']);
        $mail->addAddress($to_email);

        // --- Content ---
        $mail->isHTML(true);
        $mail->Subject = 'Vamanan Gold - Password Reset Verification Code';
        
        // Professional HTML Template
        $mail->Body = "
        <html>
        <head>
            <style>
                .container { font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 24px; overflow: hidden; background: #fff; }
                .header { background: #000; color: #D4AF37; padding: 40px; text-align: center; }
                .content { padding: 40px; color: #333; line-height: 1.6; }
                .otp-box { background: #fdfaf0; padding: 30px; border-radius: 20px; text-align: center; margin: 30px 0; border: 2px dashed #D4AF37; }
                .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #000; margin: 0; font-family: 'Courier New', Courier, monospace; }
                .footer { background: #f8f9fa; padding: 24px; text-align: center; font-size: 11px; color: #999; }
                .security-note { font-size: 12px; color: #666; margin-top: 24px; border-top: 1px solid #eee; pt: 16px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 style='margin:0; letter-spacing: -1px; font-size: 28px;'>VAMANAN ENTERPRISES V</h1>
                </div>
                <div class='content'>
                    <h2 style='color: #000; margin-top: 0;'>Secure OTP Verification</h2>
                    <p>We received a request to access your Vamanan Gold account. For your security, please use the verification code below to authorize this session.</p>
                    
                    <div class='otp-box'>
                        <p style='font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 10px; font-weight: 800;'>Your Security OTP</p>
                        <h1 class='otp-code'>$otp</h1>
                    </div>
                    
                    <p>This code will expire in <strong>10 minutes</strong>. If you did not make this request, please ignore this email or update your password immediately.</p>
                    
                    <div class='security-note'>
                        <p><strong>Security Tip:</strong> Never share your OTP with anyone, including Vamanan Gold staff. We will never ask for your code via phone or chat.</p>
                    </div>
                </div>
                <div class='footer'>
                    <p>© 2026 Vamanan Enterprises. All Rights Reserved.<br>Authorized and Secured Digital Gold Ecosystem.</p>
                </div>
            </div>
        </body>
        </html>
        ";

        // Plain text version for non-HTML email clients
        $mail->AltBody = "Your Vamanan Gold verification code is: $otp. This code expires in 10 minutes.";

        $mail->send();
        return true;

    } catch (Exception $e) {
        // Log error for debugging
        file_put_contents(__DIR__ . '/mail_error_log.txt', "[" . date('Y-m-d H:i:s') . "] Mail Error: {$mail->ErrorInfo}\n", FILE_APPEND);
        return false;
    }
}

function sendLoginOTPMail($to_email, $otp) {
    global $use_phpmailer;
    
    // Always log the OTP for local development
    file_put_contents(__DIR__ . '/mail_log.txt', "[" . date('Y-m-d H:i:s') . "] [LOGIN OTP] TO: $to_email | OTP: $otp\n", FILE_APPEND);

    if (!$use_phpmailer) {
        return true; // Return true so flow continues even without real mail
    }

    // Load secure credentials
    $config = require __DIR__ . '/config/mail_config.php';
    
    $mail = new PHPMailer(true);

    try {
        // --- Server Settings ---
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $config['smtp_port'];

        // --- Recipients ---
        $mail->setFrom($config['from_email'], 'Vamanan Gold Security');
        $mail->addAddress($to_email);

        // --- Content ---
        $mail->isHTML(true);
        $mail->Subject = 'Vamanan Gold - Secure Login Verification Code';
        
        // Professional Fintech HTML Template
        $mail->Body = "
        <html>
        <head>
            <style>
                .container { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: #ffffff; }
                .header { background: #0f172a; color: #fbbf24; padding: 40px; text-align: center; border-bottom: 4px solid #fbbf24; }
                .content { padding: 40px; color: #334155; line-height: 1.6; }
                .otp-box { background: #fffbeb; padding: 30px; border-radius: 20px; text-align: center; margin: 30px 0; border: 2px dashed #fbbf24; }
                .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #0f172a; margin: 0; font-family: 'Courier New', Courier, monospace; }
                .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
                .security-note { font-size: 12px; color: #475569; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 style='margin:0; letter-spacing: 1px; font-size: 26px; text-transform: uppercase; font-weight: 900;'>VAMANAN GOLD</h1>
                    <p style='margin: 5px 0 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #94a3b8;'>Vamanan Enterprises</p>
                </div>
                <div class='content'>
                    <h2 style='color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;'>Secure Login Verification</h2>
                    <p>We detected an authorization attempt for your Vamanan Gold account. To finalize your login protocol, please utilize the verification code detailed below:</p>
                    
                    <div class='otp-box'>
                        <p style='font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #d97706; margin-bottom: 10px; font-weight: 800;'>Secure Verification Code</p>
                        <h1 class='otp-code'>$otp</h1>
                    </div>
                    
                    <p>This code will expire in <strong>10 minutes</strong>. If you did not initiate this authentication request, please secure your credentials immediately or contact Vamanan Support.</p>
                    
                    <div class='security-note'>
                        <p><strong>Fintech Security Alert:</strong> To protect your assets, never share this OTP with anybody, including staff members of Vamanan Enterprises. We will never request this code under any circumstances.</p>
                    </div>
                </div>
                <div class='footer'>
                    <p>© 2026 Vamanan Enterprises V. All Rights Reserved.<br>Authorized and Secured Digital Gold Infrastructure Node.</p>
                </div>
            </div>
        </body>
        </html>
        ";

        // Plain text version for non-HTML email clients
        $mail->AltBody = "Your Vamanan Gold secure login verification code is: $otp. This code expires in 10 minutes.";

        $mail->send();
        return true;

    } catch (Exception $e) {
        // Log error for debugging
        file_put_contents(__DIR__ . '/mail_error_log.txt', "[" . date('Y-m-d H:i:s') . "] Mail Error: {$mail->ErrorInfo}\n", FILE_APPEND);
        return false;
    }
}
?>
