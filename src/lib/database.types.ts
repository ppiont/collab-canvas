/**
 * Database type definitions for Supabase
 * For MVP: Using Auth and Storage only, no custom tables
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            // No custom tables needed for MVP - using Auth and Storage only
        };
        Views: {
            // No views
        };
        Functions: {
            // No functions
        };
        Enums: {
            // No enums
        };
    };
}

