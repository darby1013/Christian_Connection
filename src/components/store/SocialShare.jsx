import React from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, MessageCircle, Mail, Link2, Check } from 'lucide-react';
import { useState } from 'react';

export default function SocialShare({ product, url }) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || window.location.href;
  const shareText = `Check out ${product.name} - $${product.price}`;

  const handleShare = (platform) => {
    let shareLink = '';
    
    switch(platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-white font-bold mb-3">Share this product:</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => handleShare('facebook')} className="bg-blue-600 hover:bg-blue-700">
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </Button>
        <Button size="sm" onClick={() => handleShare('twitter')} className="bg-sky-500 hover:bg-sky-600">
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </Button>
        <Button size="sm" onClick={() => handleShare('whatsapp')} className="bg-green-600 hover:bg-green-700">
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
        <Button size="sm" onClick={() => handleShare('email')} className="bg-slate-700 hover:bg-slate-600">
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Button size="sm" onClick={copyLink} variant="outline" className="border-slate-600">
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>
    </div>
  );
}