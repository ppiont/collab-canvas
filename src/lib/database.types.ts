/**
 * Database type definitions for Supabase
 * These will be generated once Supabase project is created
 * For now, using minimal types for MVP
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            // No tables needed for MVP - using Auth and Storage only
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

