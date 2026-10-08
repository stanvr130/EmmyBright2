import React from 'react';

const WHATSAPP_NUMBER = '2348139108077'; // 08139108077 in international format, no leading zero

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      style={styles.button}
    >
      <svg viewBox="0 0 32 32" width="26" height="26" fill="#ffffff">
        <path d="M16.004 3C9.374 3 4 8.373 4 15.002c0 2.455.726 4.738 1.976 6.654L4 29l7.52-1.937a11.94 11.94 0 0 0 4.484.874h.001c6.63 0 12.003-5.373 12.003-12.002C28.008 8.373 22.635 3 16.004 3zm0 21.726a9.69 9.69 0 0 1-4.94-1.354l-.354-.21-4.463 1.15 1.19-4.35-.23-.366a9.68 9.68 0 0 1-1.49-5.194c0-5.362 4.364-9.726 9.73-9.726 5.364 0 9.726 4.363 9.726 9.726 0 5.364-4.362 9.726-9.73 9.726l.057-.002zm5.34-7.287c-.293-.147-1.735-.857-2.004-.955-.27-.098-.466-.147-.662.147-.195.293-.76.955-.932 1.15-.172.196-.343.22-.636.073-.293-.147-1.237-.456-2.356-1.455-.871-.777-1.459-1.737-1.63-2.03-.172-.293-.018-.452.129-.598.133-.132.293-.343.44-.515.146-.172.195-.293.293-.49.098-.195.049-.367-.025-.514-.073-.147-.661-1.595-.906-2.184-.238-.572-.48-.494-.661-.503l-.562-.01c-.195 0-.514.073-.783.367-.27.293-1.03 1.007-1.03 2.456 0 1.448 1.055 2.848 1.202 3.044.146.195 2.077 3.173 5.034 4.449.703.303 1.252.484 1.68.62.706.224 1.348.192 1.856.117.566-.085 1.735-.709 1.98-1.393.244-.684.244-1.27.171-1.393-.073-.122-.268-.195-.561-.342z"/>
      </svg>
    </a>
  );
}

const styles = {
  button: {
    position: 'fixed',
    bottom: '68px', // sits just above the 56px mobile bottom bar
    right: '16px',
    zIndex: 1200,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#25D366',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    textDecoration: 'none'
  }
};