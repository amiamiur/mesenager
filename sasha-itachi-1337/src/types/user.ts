export interface User {
    id: number;
    username: string;
    display_name: string;
    avatar_path: string | null;
    status: string;
    bio: string;
    created_at: string;
}