#!/usr/bin/env python3
"""
History Viewer for Speech Translation Pipeline
Browse and filter past translation sessions
"""
import argparse
from datetime import datetime, timedelta
from session_manager import SessionManager, SessionStatus

try:
    from tabulate import tabulate
    HAS_TABULATE = True
except ImportError:
    HAS_TABULATE = False


def format_duration(seconds):
    """Format duration in a human-readable way"""
    if seconds is None:
        return "N/A"
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        return f"{seconds/3600:.1f}h"


def list_sessions(manager, args):
    """List sessions with filtering"""
    status = None
    if args.status:
        status = SessionStatus(args.status)
    
    start_date = None
    if args.start_date:
        start_date = datetime.fromisoformat(args.start_date)
    
    end_date = None
    if args.end_date:
        end_date = datetime.fromisoformat(args.end_date)
    
    # Handle relative date filters
    if args.last_days:
        start_date = datetime.now() - timedelta(days=args.last_days)
    
    sessions = manager.get_sessions(
        status=status,
        start_date=start_date,
        end_date=end_date,
        source_lang=args.source_lang,
        target_lang=args.target_lang
    )
    
    if not sessions:
        print("No sessions found matching the criteria.")
        return
    
    # Prepare table data
    table_data = []
    for session in sessions:
        start_time = datetime.fromtimestamp(session['start_time'])
        duration = session.get('duration_seconds')
        
        table_data.append([
            session['session_id'],
            start_time.strftime('%Y-%m-%d %H:%M'),
            session['status'],
            f"{session['source_lang']} → {session['target_lang']}",
            session['model_size'],
            session['event_count'],
            format_duration(duration)
        ])
    
    headers = ['Session ID', 'Start Time', 'Status', 'Languages', 'Model', 'Events', 'Duration']
    
    if HAS_TABULATE:
        print("\n" + tabulate(table_data, headers=headers, tablefmt='grid'))
    else:
        # Fallback to simple text formatting
        print("\n" + " | ".join(headers))
        print("-" * 120)
        for row in table_data:
            print(" | ".join(str(cell) for cell in row))
    
    print(f"\nTotal sessions: {len(sessions)}")


def show_session_details(manager, session_id):
    """Show detailed information about a session"""
    manager.print_session_summary(session_id)
    
    # Get full session data
    sessions = manager.get_sessions()
    session = next((s for s in sessions if s['session_id'] == session_id), None)
    
    if not session or not session['events']:
        return
    
    print("Recent Events:")
    print("-" * 80)
    
    # Show last 10 events
    recent_events = session['events'][-10:]
    for i, event in enumerate(recent_events, 1):
        event_time = datetime.fromtimestamp(event['timestamp'])
        total_latency = (event['stt_latency_ms'] + 
                        event['mt_latency_ms'] + 
                        event['tts_latency_ms'])
        
        print(f"\n[{i}] {event_time.strftime('%H:%M:%S')}")
        print(f"    Source:      {event['source_text']}")
        print(f"    Translation: {event['translated_text']}")
        print(f"    Latency:     {total_latency:.0f}ms (STT: {event['stt_latency_ms']:.0f}ms, "
              f"MT: {event['mt_latency_ms']:.0f}ms, TTS: {event['tts_latency_ms']:.0f}ms)")
    
    if len(session['events']) > 10:
        print(f"\n... and {len(session['events']) - 10} more events")


def archive_sessions(manager, args):
    """Archive old sessions"""
    threshold_days = args.threshold_days or manager.config['archive_threshold_days']
    count = manager.archive_old_sessions(threshold_days)
    print(f"Archived {count} sessions older than {threshold_days} days")


def unarchive_session(manager, session_id):
    """Unarchive a session"""
    success = manager.unarchive_session(session_id)
    if success:
        print(f"Successfully unarchived session: {session_id}")
    else:
        print(f"Failed to unarchive session: {session_id}")


def export_sessions(manager, args):
    """Export sessions to file"""
    start_date = None
    if args.start_date:
        start_date = datetime.fromisoformat(args.start_date)
    
    end_date = None
    if args.end_date:
        end_date = datetime.fromisoformat(args.end_date)
    
    if args.last_days:
        start_date = datetime.now() - timedelta(days=args.last_days)
    
    if args.format == 'json':
        count = manager.export_to_json(
            args.output,
            start_date=start_date,
            end_date=end_date,
            source_lang=args.source_lang,
            target_lang=args.target_lang
        )
    else:  # csv
        count = manager.export_to_csv(
            args.output,
            start_date=start_date,
            end_date=end_date,
            source_lang=args.source_lang,
            target_lang=args.target_lang
        )
    
    print(f"Export complete: {count} sessions/events written to {args.output}")


def main():
    parser = argparse.ArgumentParser(
        description="View and manage speech translation session history"
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # List sessions command
    list_parser = subparsers.add_parser('list', help='List sessions')
    list_parser.add_argument('--status', choices=['active', 'completed', 'archived'],
                           help='Filter by status')
    list_parser.add_argument('--start-date', help='Start date (ISO format: YYYY-MM-DD)')
    list_parser.add_argument('--end-date', help='End date (ISO format: YYYY-MM-DD)')
    list_parser.add_argument('--last-days', type=int, help='Show sessions from last N days')
    list_parser.add_argument('--source-lang', help='Filter by source language')
    list_parser.add_argument('--target-lang', help='Filter by target language')
    
    # Show session details command
    show_parser = subparsers.add_parser('show', help='Show session details')
    show_parser.add_argument('session_id', help='Session ID to display')
    
    # Archive command
    archive_parser = subparsers.add_parser('archive', help='Archive old sessions')
    archive_parser.add_argument('--threshold-days', type=int,
                              help='Archive sessions older than N days')
    
    # Unarchive command
    unarchive_parser = subparsers.add_parser('unarchive', help='Unarchive a session')
    unarchive_parser.add_argument('session_id', help='Session ID to unarchive')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export sessions')
    export_parser.add_argument('output', help='Output file path')
    export_parser.add_argument('--format', choices=['json', 'csv'], default='json',
                             help='Export format')
    export_parser.add_argument('--start-date', help='Start date (ISO format: YYYY-MM-DD)')
    export_parser.add_argument('--end-date', help='End date (ISO format: YYYY-MM-DD)')
    export_parser.add_argument('--last-days', type=int, help='Export sessions from last N days')
    export_parser.add_argument('--source-lang', help='Filter by source language')
    export_parser.add_argument('--target-lang', help='Filter by target language')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = SessionManager()
    
    if args.command == 'list':
        list_sessions(manager, args)
    elif args.command == 'show':
        show_session_details(manager, args.session_id)
    elif args.command == 'archive':
        archive_sessions(manager, args)
    elif args.command == 'unarchive':
        unarchive_session(manager, args.session_id)
    elif args.command == 'export':
        export_sessions(manager, args)


if __name__ == '__main__':
    main()
