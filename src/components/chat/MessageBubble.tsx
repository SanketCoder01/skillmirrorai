// =====================================================
// MESSAGE BUBBLE - WhatsApp-style message display
// STRICT ALIGNMENT: senderId === currentUser._id → RIGHT
// =====================================================

import { Check, CheckCheck, File, Download } from 'lucide-react';
import { Message } from './types';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string; // logged-in user's _id
  showDate?: boolean;
  dateText?: string;
}

export const MessageBubble = ({ 
  message, 
  currentUserId,
  showDate, 
  dateText 
}: MessageBubbleProps) => {
  // =====================================================
  // CRITICAL: ALIGNMENT LOGIC
  // ONLY compare senderId with currentUser._id
  // DO NOT use role or name comparison
  // =====================================================
  const isOutgoing = message.senderId === currentUserId;

  // isOutgoing = TRUE  → RIGHT side, green bubble
  // isOutgoing = FALSE → LEFT side, gray bubble

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Date Divider */}
      {showDate && dateText && (
        <div className="flex justify-center my-4">
          <span className="px-3 py-1 bg-[#182229] text-[#8696a0] rounded-md text-xs">
            {dateText}
          </span>
        </div>
      )}

      {/* Message Container - Alignment based on isOutgoing */}
      <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-1`}>
        <div
          className={`max-w-[65%] px-3 py-1.5 shadow-sm relative ${
            isOutgoing
              ? 'bg-[#005c4b] text-white rounded-l-lg rounded-tr-lg' // RIGHT: green
              : 'bg-[#202c33] text-white rounded-r-lg rounded-tl-lg' // LEFT: gray
          }`}
        >
          {/* Message Text */}
          <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
            {message.content}
          </p>

          {/* Attachment */}
          {message.attachmentUrl && (
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 mt-2 p-2 rounded-lg text-xs ${
                isOutgoing ? 'bg-[#00483d]' : 'bg-[#2a3942]'
              }`}
            >
              <File className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">
                {message.attachmentName || 'Attachment'}
              </span>
              <Download className="h-3 w-3 shrink-0" />
            </a>
          )}

          {/* Time & Status Ticks */}
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[#8696a0]">
            <span className="text-[10px]">
              {formatTime(message.createdAt)}
            </span>

            {/* Tick Indicators - Only for outgoing messages (sender) */}
            {isOutgoing && (
              <span className="flex ml-0.5">
                {message.status === 'seen' ? (
                  // ✓✓ blue = seen
                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                ) : message.status === 'delivered' ? (
                  // ✓✓ gray = delivered
                  <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />
                ) : (
                  // ✓ = sent
                  <Check className="h-3.5 w-3.5 text-[#8696a0]" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
