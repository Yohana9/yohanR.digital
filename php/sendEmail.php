<?php
/**
 * Contact Form Handler
 * No Database Required - Uses PHP mail() function only
 */

// ===== CONFIGURATION =====
define('SITE_EMAIL', 'yohanreta9@gmail.com'); // Your email here
define('SITE_NAME', 'Yohannes Reta Portfolio');
define('ADMIN_NAME', 'Yohannes Reta');
define('MAX_MESSAGE_LENGTH', 2000);
define('MIN_MESSAGE_LENGTH', 10);

// ===== SECURITY HEADERS =====
header("Content-Type: application/json");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

// Allow CORS for local development
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== VALIDATION FUNCTIONS (No DB Required) =====
function validateName($name) {
    $name = trim($name);
    if (empty($name) || strlen($name) < 2) {
        return ['valid' => false, 'error' => 'Name must be at least 2 characters'];
    }
    
    if (strlen($name) > 100) {
        return ['valid' => false, 'error' => 'Name is too long'];
    }
    
    // Basic character validation
    if (!preg_match('/^[a-zA-Z\s\-\.\']+$/', $name)) {
        return ['valid' => false, 'error' => 'Name contains invalid characters'];
    }
    
    return ['valid' => true, 'data' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8')];
}

function validateEmail($email) {
    $email = trim($email);
    
    if (empty($email)) {
        return ['valid' => false, 'error' => 'Email is required'];
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['valid' => false, 'error' => 'Invalid email format'];
    }
    
    if (strlen($email) > 150) {
        return ['valid' => false, 'error' => 'Email is too long'];
    }
    
    return ['valid' => true, 'data' => filter_var($email, FILTER_SANITIZE_EMAIL)];
}

function validateSubject($subject) {
    $subject = trim($subject);
    
    if (empty($subject)) {
        return ['valid' => false, 'error' => 'Subject is required'];
    }
    
    if (strlen($subject) < 3) {
        return ['valid' => false, 'error' => 'Subject must be at least 3 characters'];
    }
    
    if (strlen($subject) > 200) {
        return ['valid' => false, 'error' => 'Subject must not exceed 200 characters'];
    }
    
    return ['valid' => true, 'data' => htmlspecialchars($subject, ENT_QUOTES, 'UTF-8')];
}

function validateMessage($message) {
    $message = trim($message);
    
    if (empty($message)) {
        return ['valid' => false, 'error' => 'Message is required'];
    }
    
    if (strlen($message) < MIN_MESSAGE_LENGTH) {
        return ['valid' => false, 'error' => 'Message must be at least ' . MIN_MESSAGE_LENGTH . ' characters'];
    }
    
    if (strlen($message) > MAX_MESSAGE_LENGTH) {
        return ['valid' => false, 'error' => 'Message must not exceed ' . MAX_MESSAGE_LENGTH . ' characters'];
    }
    
    // Remove potentially harmful content
    $message = strip_tags($message);
    $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    
    return ['valid' => true, 'data' => $message];
}

function validateHoneypot($honeypot) {
    // Honeypot field should always be empty (bots will fill it)
    return empty($honeypot);
}

// ===== SIMPLE RATE LIMITING (File-based, no DB) =====
function checkRateLimit($ip) {
    $limit = 5; // Max 5 requests per hour
    $timeout = 3600; // 1 hour
    
    $cacheFile = __DIR__ . '/rate_limit_cache.json';
    
    // Create cache file if doesn't exist
    if (!file_exists($cacheFile)) {
        file_put_contents($cacheFile, json_encode([]));
    }
    
    $data = json_decode(file_get_contents($cacheFile), true) ?: [];
    $currentTime = time();
    
    // Clean old entries
    foreach ($data as $key => $entry) {
        if ($currentTime - $entry['timestamp'] > $timeout) {
            unset($data[$key]);
        }
    }
    
    // Check current IP
    if (isset($data[$ip])) {
        if ($currentTime - $data[$ip]['timestamp'] < $timeout) {
            if ($data[$ip]['count'] >= $limit) {
                return false;
            }
            $data[$ip]['count']++;
        } else {
            $data[$ip] = ['count' => 1, 'timestamp' => $currentTime];
        }
    } else {
        $data[$ip] = ['count' => 1, 'timestamp' => $currentTime];
    }
    
    file_put_contents($cacheFile, json_encode($data));
    return true;
}

// ===== EMAIL SENDING (No DB Required) =====
function sendEmail($data) {
    $to = SITE_EMAIL;
    $subject = "Portfolio Contact: " . $data['subject'];
    
    // Email body (HTML and plain text)
    $htmlBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #06b6d4); color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #2563eb; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>New Contact Form Submission</h1>
                <p>From: " . SITE_NAME . "</p>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='field-label'>Name:</div>
                    <div>" . $data['name'] . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Email:</div>
                    <div>" . $data['email'] . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Subject:</div>
                    <div>" . $data['subject'] . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Message:</div>
                    <div>" . nl2br($data['message']) . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>IP Address:</div>
                    <div>" . $data['ip'] . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Time:</div>
                    <div>" . date('Y-m-d H:i:s') . "</div>
                </div>
            </div>
            <div class='footer'>
                <p>This email was sent from the contact form on " . SITE_NAME . " website.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $plainBody = "New Contact Form Submission\n";
    $plainBody .= "---------------------------\n";
    $plainBody .= "Name: " . $data['name'] . "\n";
    $plainBody .= "Email: " . $data['email'] . "\n";
    $plainBody .= "Subject: " . $data['subject'] . "\n";
    $plainBody .= "Message:\n" . $data['message'] . "\n\n";
    $plainBody .= "IP: " . $data['ip'] . "\n";
    $plainBody .= "Time: " . date('Y-m-d H:i:s') . "\n";
    
    // Email headers
    $headers = [
        'From' => SITE_NAME . ' <' . SITE_EMAIL . '>',
        'Reply-To' => $data['email'],
        'Return-Path' => SITE_EMAIL,
        'X-Mailer' => 'PHP/' . phpversion(),
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/html; charset=UTF-8',
        'X-Priority' => '1',
    ];
    
    // Format headers
    $headersString = '';
    foreach ($headers as $key => $value) {
        $headersString .= "$key: $value\r\n";
    }
    
    // Additional security headers
    $headersString .= "X-Content-Type-Options: nosniff\r\n";
    
    // Send email
    return mail($to, $subject, $htmlBody, $headersString);
}

// ===== SIMPLE LOGGING (File-based, no DB) =====
function logEmailAttempt($data, $success) {
    $logDir = __DIR__ . '/logs/';
    
    // Create logs directory if it doesn't exist
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . 'contact_log_' . date('Y-m') . '.txt';
    $status = $success ? 'SUCCESS' : 'FAILED';
    
    $logEntry = "[" . date('Y-m-d H:i:s') . "] $status - ";
    $logEntry .= "IP: {$data['ip']} - ";
    $logEntry .= "Name: {$data['name']} - ";
    $logEntry .= "Email: {$data['email']}\n";
    
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// ===== MAIN EXECUTION =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Please use POST.'
    ]);
    exit();
}

// Get client IP
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ip = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
}

// Check rate limiting
if (!checkRateLimit($ip)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Too many requests. Please try again in an hour.'
    ]);
    exit();
}

// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

// Get form data
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$subject = $_POST['subject'] ?? '';
$message = $_POST['message'] ?? '';
$honeypot = $_POST['website'] ?? ''; // Hidden honeypot field

// Validate honeypot (bot detection)
if (!validateHoneypot($honeypot)) {
    // Bot detected - return success but don't send email
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully!'
    ]);
    exit();
}

// Validate all fields
$validations = [
    'name' => validateName($name),
    'email' => validateEmail($email),
    'subject' => validateSubject($subject),
    'message' => validateMessage($message)
];

$hasErrors = false;
$cleanData = [];

foreach ($validations as $field => $validation) {
    if (!$validation['valid']) {
        $response['errors'][$field] = $validation['error'];
        $hasErrors = true;
    } else {
        $cleanData[$field] = $validation['data'];
    }
}

if ($hasErrors) {
    http_response_code(400);
    $response['message'] = 'Please fix the errors above.';
    echo json_encode($response);
    exit();
}

// Add IP to clean data
$cleanData['ip'] = $ip;

// Try to send email
try {
    $sent = sendEmail($cleanData);
    
    if ($sent) {
        $response['success'] = true;
        $response['message'] = 'Message sent successfully! I\'ll get back to you soon.';
        http_response_code(200);
    } else {
        $response['message'] = 'Failed to send message. The server might not be configured for email.';
        http_response_code(500);
    }
    
    // Log the attempt
    logEmailAttempt($cleanData, $sent);
    
} catch (Exception $e) {
    $response['message'] = 'An unexpected error occurred. Please try again later.';
    http_response_code(500);
}

// Return JSON response
echo json_encode($response);
?>