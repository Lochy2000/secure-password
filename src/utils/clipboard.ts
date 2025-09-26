/**
 * Clipboard utilities with automatic clearing for security
 */

interface ClipboardOptions {
  clearAfterMs?: number;
  showNotification?: boolean;
}

/**
 * Copy text to clipboard with automatic clearing after timeout
 */
export async function copyToClipboard(
  text: string, 
  options: ClipboardOptions = {}
): Promise<boolean> {
  const { 
    clearAfterMs = 30000, // 30 seconds default
    showNotification = true 
  } = options;

  try {
    // Use modern clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('Copy command failed');
      }
    }

    // Schedule clipboard clearing
    if (clearAfterMs > 0) {
      setTimeout(async () => {
        await clearClipboard();
      }, clearAfterMs);
    }

    // Show notification if requested
    if (showNotification) {
      showCopyNotification(clearAfterMs);
    }

    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Clear the clipboard
 */
export async function clearClipboard(): Promise<boolean> {
  try {
    // Use modern clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText('');
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = '';
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    }
  } catch (error) {
    console.error('Failed to clear clipboard:', error);
    return false;
  }
}

/**
 * Show a temporary notification that something was copied
 */
function showCopyNotification(clearAfterMs: number): void {
  // Create a simple toast notification
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = `Copied! Will clear in ${Math.ceil(clearAfterMs / 1000)}s`;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: '#4ade80',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '10000',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  });

  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

/**
 * Copy password with enhanced security measures
 */
export async function copyPassword(password: string): Promise<boolean> {
  return await copyToClipboard(password, {
    clearAfterMs: 30000, // 30 seconds for passwords
    showNotification: true
  });
}

/**
 * Copy username with standard timeout
 */
export async function copyUsername(username: string): Promise<boolean> {
  return await copyToClipboard(username, {
    clearAfterMs: 60000, // 60 seconds for usernames
    showNotification: true
  });
}