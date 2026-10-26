import React from 'react';
import { NewsView } from './NewsView';

/**
 * EventsView is an alias/re-export of the unified News & Events view.
 * Enables direct imports and route targeting for #/events alongside #/news.
 */
export const EventsView: React.FC = NewsView;
export default EventsView;
