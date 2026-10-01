export interface Message {
    id: number;
    chat_id: number;
    author_id: number;
    type: 'text' | 'image';
    body: string | null;
    attachment: string | null;
    created_at: string;
    author_name: string;
}