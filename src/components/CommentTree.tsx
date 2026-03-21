import React, { useState, useCallback } from 'react';
import { Comment } from '@/types/blog';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { BsReply, BsHeart, BsHeartFill, BsTrash, BsEyeSlash, BsEye } from 'react-icons/bs';

interface CommentTreeProps {
  comments: Comment[];
  currentUserId?: number;
  isPostAuthor: boolean;
  onReply: (commentId: number) => void;
  onLike: (commentId: number) => void;
  onModerate: (commentId: number, action: string) => void;
  maxDepth?: number;
  isMobile?: boolean;
}

const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  currentUserId,
  isPostAuthor,
  onReply,
  onLike,
  onModerate,
  maxDepth = 3,
  isMobile = false,
}) => {
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({}); 

  const toggleExpand = useCallback((commentId: number) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }, []);

  const renderComment = useCallback((comment: Comment, depth = 0) => {
    const isExpanded = expandedComments[comment.id] !== false; // Default to expanded
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isAuthor = currentUserId === comment.user.id;
    const isCommentHidden = comment.hidden;
    
    // Calculate indentation based on depth and screen size
    const indentSize = isMobile ? 12 : 24;
    const maxIndent = isMobile ? 36 : 72; // Cap indentation on mobile
    const indent = Math.min(depth * indentSize, maxIndent);
    
    return (
      <div key={comment.id} className="comment-thread">
        <div 
          className={`comment ${isCommentHidden ? 'opacity-50' : ''}`}
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="comment-header flex items-center gap-2 mb-1">
            {comment.user.profile?.image ? (
              <Image 
                src={comment.user.profile.image} 
                alt={comment.user.username} 
                width={32} 
                height={32} 
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {comment.user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {comment.user.username}
                  {isAuthor && <span className="ml-1 text-xs text-blue-500">(You)</span>}
                  {comment.is_post_author && <span className="ml-1 text-xs text-green-500">(Author)</span>}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.date), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="comment-content pl-10 mb-2">
            <p className="text-sm">{comment.content}</p>
          </div>
          
          <div className="comment-actions pl-10 flex items-center gap-4 text-xs">
            <button 
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
            >
              <BsReply />
              <span>Reply</span>
            </button>
            
            <button 
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1 text-gray-500 hover:text-red-500"
            >
              {comment.is_liked ? <BsHeartFill className="text-red-500" /> : <BsHeart />}
              <span>{comment.likes_count || 0}</span>
            </button>
            
            {(isPostAuthor || isAuthor) && (
              <div className="flex items-center gap-2">
                {isPostAuthor && (
                  <button 
                    onClick={() => onModerate(comment.id, isCommentHidden ? 'unhide' : 'hide')}
                    className="flex items-center gap-1 text-gray-500 hover:text-yellow-500"
                    title={isCommentHidden ? "Unhide comment" : "Hide comment"}
                  >
                    {isCommentHidden ? <BsEye /> : <BsEyeSlash />}
                  </button>
                )}
                
                <button 
                  onClick={() => onModerate(comment.id, 'delete')}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500"
                  title="Delete comment"
                >
                  <BsTrash />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Render replies if expanded and not at max depth */}
        {hasReplies && depth < maxDepth && isExpanded && (
          <div className="replies">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
        
        {/* Show expand/collapse button for deep threads or on mobile */}
        {hasReplies && (depth >= maxDepth || isMobile) && (
          <button
            onClick={() => toggleExpand(comment.id)}
            className="text-xs text-blue-500 hover:underline ml-10 mt-1"
            style={{ marginLeft: `${indent + 40}px` }}
          >
            {isExpanded ? 'Hide replies' : `Show ${comment.replies.length} replies`}
          </button>
        )}
      </div>
    );
  }, [currentUserId, expandedComments, isMobile, isPostAuthor, onLike, onModerate, onReply]);

  // Virtualization helper for large comment threads
  const renderVirtualizedComments = () => {
    // Only render visible comments (simplified virtualization)
    // For a real implementation, use react-window or react-virtualized
    return comments.map(comment => renderComment(comment));
  };

  return (
    <div className="comments-container space-y-4">
      {renderVirtualizedComments()}
    </div>
  );
};

export default CommentTree;
