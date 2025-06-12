const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

class DeviceFingerprint {
    static async getDeviceInfo() {
        try {
            const deviceInfo = {
                // Hardware serial numbers
                ...await this.getHardwareSerials()
            };
            
            // Tạo device fingerprint hash
            const fingerprintString = JSON.stringify(deviceInfo);
            const deviceId = crypto.createHash('sha256')
                .update(fingerprintString)
                .digest('hex');
            
            return {
                deviceId,
                deviceInfo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting device info:', error);
            // Fallback fingerprint
            return {
                deviceId: crypto.randomBytes(16).toString('hex'),
                deviceInfo: { platform: os.platform() },
                timestamp: new Date().toISOString()
            };
        }
    }
    
    static async getHardwareSerials() {
        const platform = os.platform();
        const arch = os.arch();
        let hwInfo = {};
        
        try {
            switch (platform) {
                case 'win32':
                    // Windows: Get motherboard serial
                    let winSerial = execSync('wmic baseboard get serialnumber /value', { encoding: 'utf8' });
                    if(!winSerial && arch === 'x64') {
                        winSerial = execSync('powershell "Get-WmiObject -Class Win32_BaseBoard | Select-Object SerialNumber"', { encoding: 'utf8' });
                    }
                    hwInfo.motherboardSerial = winSerial.match(/SerialNumber=(.+)/)?.[1]?.trim();
                    
                    // Windows: Get disk serial
                    const diskSerial = execSync('wmic diskdrive get serialnumber /value', { encoding: 'utf8' });
                    hwInfo.diskSerial = diskSerial.match(/SerialNumber=(.+)/)?.[1]?.trim();
                    break;
                    
                case 'darwin':
                    // macOS: Get hardware UUID
                    hwInfo.hardwareUUID = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { encoding: 'utf8' }).split(':')[1]?.trim();
                    
                    // macOS: Get serial number
                    hwInfo.serialNumber = execSync('system_profiler SPHardwareDataType | grep "Serial Number"', { encoding: 'utf8' }).split(':')[1]?.trim();
                    break;
                    
                case 'linux':
                    // Linux: Get machine ID
                    hwInfo.machineId = execSync('cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id 2>/dev/null || echo "unknown"', { encoding: 'utf8' }).trim();
                    
                    // Linux: Get DMI product UUID
                    try {
                        hwInfo.productUUID = execSync('sudo cat /sys/class/dmi/id/product_uuid 2>/dev/null || echo "unknown"', { encoding: 'utf8' }).trim();
                    } catch {
                        hwInfo.productUUID = 'unknown';
                    }
                    break;
            }
        } catch (error) {
            console.warn('Could not get hardware serials:', error.message);
        }
        
        return hwInfo;
    }
}

module.exports = DeviceFingerprint;