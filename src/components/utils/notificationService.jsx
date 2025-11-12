/**
 * Browser Notification Service
 */

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = false;
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.isSupported = true;
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') return true;
    if (this.permission === 'denied') return false;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async notify(title, options = {}) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.log('Cannot send notification - permission denied');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  notifyLiveStream(streamTitle, hostName, options = {}) {
    return this.notify(`🔴 LIVE NOW: ${streamTitle}`, {
      body: `${hostName} is streaming live!`,
      tag: 'livestream',
      requireInteraction: true,
      ...options,
    });
  }

  notifyLivePodcast(podcastTitle, hostName, options = {}) {
    return this.notify(`🎙️ LIVE PODCAST: ${podcastTitle}`, {
      body: `${hostName} is podcasting live!`,
      tag: 'livepodcast',
      requireInteraction: true,
      ...options,
    });
  }

  notifyNewContent(contentType, title, options = {}) {
    return this.notify(`✨ New ${contentType}!`, {
      body: title,
      tag: `new-${contentType}`,
      ...options,
    });
  }

  notifyOrder(orderNumber, status, options = {}) {
    return this.notify(`📦 Order ${orderNumber}`, {
      body: `Status: ${status}`,
      tag: 'order-update',
      ...options,
    });
  }

  notifyMessage(senderName, message, options = {}) {
    return this.notify(`💬 Message from ${senderName}`, {
      body: message.substring(0, 100),
      tag: 'new-message',
      ...options,
    });
  }
}

export default new NotificationService();