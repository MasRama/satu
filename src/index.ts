import WhatsApp from './services/WhatsApp';

// Example usage
async function main() {
    try {
        // WhatsApp client will automatically initialize and connect
        console.log('Starting WhatsApp client...');
        
        // You can access the WhatsApp instance and its methods
        console.log('Current status:', WhatsApp.status);
        
        // Example: Send a message (only works after QR code scan and connection)
        // await WhatsApp.sendMessage('1234567890@s.whatsapp.net', 'Hello from WhatsApp API!');
        
    } catch (error) {
        console.error('Error in main:', error);
    }
}

main();
