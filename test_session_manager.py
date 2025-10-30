#!/usr/bin/env python3
"""
Test script to demonstrate session manager functionality
"""
import time
import os
from datetime import datetime
from session_manager import SessionManager

def test_session_manager():
    print("="*60)
    print("Testing Session Manager")
    print("="*60)
    
    # Create session manager
    manager = SessionManager()
    print(f"\nSession data directory: {manager.data_dir}")
    
    # Start a session
    print("\n1. Starting a test session...")
    session_id = manager.start_session(
        source_lang="en",
        target_lang="de",
        model_size="base",
        device="cpu",
        compute_type="int8"
    )
    
    # Record some test events
    print("\n2. Recording test translation events...")
    test_translations = [
        ("Hello, how are you?", "Hallo, wie geht es dir?"),
        ("Good morning!", "Guten Morgen!"),
        ("Thank you very much.", "Vielen Dank."),
    ]
    
    for i, (source, translation) in enumerate(test_translations, 1):
        time.sleep(0.1)  # Small delay between events
        manager.record_event(
            source_text=source,
            translated_text=translation,
            stt_latency_ms=150.0 + i*10,
            mt_latency_ms=200.0 + i*15,
            tts_latency_ms=100.0 + i*5
        )
        print(f"   Event {i}: {source} -> {translation}")
    
    # End the session
    print("\n3. Ending session...")
    manager.end_session()
    
    # List sessions
    print("\n4. Listing all sessions...")
    sessions = manager.get_sessions()
    print(f"   Found {len(sessions)} session(s)")
    
    if sessions:
        print("\n5. Session summary:")
        manager.print_session_summary(sessions[0]['session_id'])
    
    # Test export
    print("\n6. Testing export to JSON...")
    json_file = "/tmp/test_export.json"
    count = manager.export_to_json(json_file)
    print(f"   Exported {count} session(s) to {json_file}")
    
    print("\n7. Testing export to CSV...")
    csv_file = "/tmp/test_export.csv"
    count = manager.export_to_csv(csv_file)
    print(f"   Exported {count} event(s) to {csv_file}")
    
    # Check file sizes
    if os.path.exists(json_file):
        size = os.path.getsize(json_file)
        print(f"   JSON file size: {size} bytes")
    
    if os.path.exists(csv_file):
        size = os.path.getsize(csv_file)
        print(f"   CSV file size: {size} bytes")
    
    print("\n" + "="*60)
    print("Test completed successfully!")
    print("="*60)

if __name__ == '__main__':
    test_session_manager()
