#!/usr/bin/env python3
"""
Session Manager for Speech Translation Pipeline
Handles recording, history, archiving, and export of translation sessions
"""
import json
import csv
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class SessionStatus(Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


@dataclass
class TranslationEvent:
    timestamp: float
    source_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    stt_latency_ms: float = 0.0
    mt_latency_ms: float = 0.0
    tts_latency_ms: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Session:
    session_id: str
    start_time: float
    end_time: Optional[float]
    source_lang: str
    target_lang: str
    model_size: str
    device: str
    compute_type: str
    status: SessionStatus
    events: List[TranslationEvent]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'session_id': self.session_id,
            'start_time': self.start_time,
            'start_time_iso': datetime.fromtimestamp(self.start_time).isoformat(),
            'end_time': self.end_time,
            'end_time_iso': datetime.fromtimestamp(self.end_time).isoformat() if self.end_time else None,
            'duration_seconds': self.end_time - self.start_time if self.end_time else None,
            'source_lang': self.source_lang,
            'target_lang': self.target_lang,
            'model_size': self.model_size,
            'device': self.device,
            'compute_type': self.compute_type,
            'status': self.status.value,
            'event_count': len(self.events),
            'events': [evt.to_dict() for evt in self.events]
        }


class SessionManager:
    """Manages recording, history, archiving, and export of translation sessions"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            data_dir = os.path.join(os.path.expanduser("~"), ".speech_translation")
        
        self.data_dir = Path(data_dir)
        self.sessions_dir = self.data_dir / "sessions"
        self.archive_dir = self.data_dir / "archive"
        self.config_file = self.data_dir / "config.json"
        
        self._ensure_directories()
        self._load_config()
        
        self.current_session: Optional[Session] = None
    
    def _ensure_directories(self):
        """Create necessary directories if they don't exist"""
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        self.archive_dir.mkdir(parents=True, exist_ok=True)
    
    def _load_config(self):
        """Load configuration settings"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = {
                'archive_threshold_days': 30,
                'auto_archive': True
            }
            self._save_config()
    
    def _save_config(self):
        """Save configuration settings"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def start_session(self, source_lang: str, target_lang: str, 
                     model_size: str, device: str, compute_type: str) -> str:
        """Start a new translation session"""
        session_id = f"session_{int(time.time())}_{os.getpid()}"
        self.current_session = Session(
            session_id=session_id,
            start_time=time.time(),
            end_time=None,
            source_lang=source_lang,
            target_lang=target_lang,
            model_size=model_size,
            device=device,
            compute_type=compute_type,
            status=SessionStatus.ACTIVE,
            events=[]
        )
        print(f"[Session Manager] Started session: {session_id}")
        return session_id
    
    def record_event(self, source_text: str, translated_text: str,
                    stt_latency_ms: float = 0.0, mt_latency_ms: float = 0.0,
                    tts_latency_ms: float = 0.0):
        """Record a translation event in the current session"""
        if self.current_session is None:
            return
        
        event = TranslationEvent(
            timestamp=time.time(),
            source_text=source_text,
            translated_text=translated_text,
            source_lang=self.current_session.source_lang,
            target_lang=self.current_session.target_lang,
            stt_latency_ms=stt_latency_ms,
            mt_latency_ms=mt_latency_ms,
            tts_latency_ms=tts_latency_ms
        )
        self.current_session.events.append(event)
    
    def end_session(self):
        """End the current session and save it"""
        if self.current_session is None:
            return
        
        self.current_session.end_time = time.time()
        self.current_session.status = SessionStatus.COMPLETED
        
        session_file = self.sessions_dir / f"{self.current_session.session_id}.json"
        with open(session_file, 'w') as f:
            json.dump(self.current_session.to_dict(), f, indent=2)
        
        print(f"[Session Manager] Ended session: {self.current_session.session_id}")
        print(f"[Session Manager] Recorded {len(self.current_session.events)} events")
        
        self.current_session = None
    
    def get_sessions(self, status: Optional[SessionStatus] = None,
                    start_date: Optional[datetime] = None,
                    end_date: Optional[datetime] = None,
                    source_lang: Optional[str] = None,
                    target_lang: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get sessions with optional filtering"""
        sessions = []
        
        # Load from both sessions and archive directories
        dirs = [self.sessions_dir]
        if status is None or status == SessionStatus.ARCHIVED:
            dirs.append(self.archive_dir)
        
        for directory in dirs:
            for session_file in directory.glob("session_*.json"):
                with open(session_file, 'r') as f:
                    session_data = json.load(f)
                
                # Apply filters
                if status and session_data['status'] != status.value:
                    continue
                
                if start_date:
                    session_time = datetime.fromtimestamp(session_data['start_time'])
                    if session_time < start_date:
                        continue
                
                if end_date:
                    session_time = datetime.fromtimestamp(session_data['start_time'])
                    if session_time > end_date:
                        continue
                
                if source_lang and session_data['source_lang'] != source_lang:
                    continue
                
                if target_lang and session_data['target_lang'] != target_lang:
                    continue
                
                sessions.append(session_data)
        
        # Sort by start time (most recent first)
        sessions.sort(key=lambda x: x['start_time'], reverse=True)
        return sessions
    
    def archive_old_sessions(self, threshold_days: Optional[int] = None):
        """Archive sessions older than threshold"""
        if threshold_days is None:
            threshold_days = self.config['archive_threshold_days']
        
        threshold_time = time.time() - (threshold_days * 24 * 3600)
        archived_count = 0
        
        for session_file in self.sessions_dir.glob("session_*.json"):
            with open(session_file, 'r') as f:
                session_data = json.load(f)
            
            # Check if session should be archived
            if (session_data['status'] == SessionStatus.COMPLETED.value and
                session_data['end_time'] and
                session_data['end_time'] < threshold_time):
                
                # Move to archive
                session_data['status'] = SessionStatus.ARCHIVED.value
                archive_file = self.archive_dir / session_file.name
                
                with open(archive_file, 'w') as f:
                    json.dump(session_data, f, indent=2)
                
                session_file.unlink()
                archived_count += 1
        
        print(f"[Session Manager] Archived {archived_count} sessions older than {threshold_days} days")
        return archived_count
    
    def unarchive_session(self, session_id: str) -> bool:
        """Move a session from archive back to active sessions"""
        archive_file = self.archive_dir / f"{session_id}.json"
        
        if not archive_file.exists():
            print(f"[Session Manager] Session {session_id} not found in archive")
            return False
        
        with open(archive_file, 'r') as f:
            session_data = json.load(f)
        
        session_data['status'] = SessionStatus.COMPLETED.value
        session_file = self.sessions_dir / archive_file.name
        
        with open(session_file, 'w') as f:
            json.dump(session_data, f, indent=2)
        
        archive_file.unlink()
        print(f"[Session Manager] Unarchived session: {session_id}")
        return True
    
    def export_to_json(self, output_path: str,
                      start_date: Optional[datetime] = None,
                      end_date: Optional[datetime] = None,
                      source_lang: Optional[str] = None,
                      target_lang: Optional[str] = None):
        """Export sessions to JSON file"""
        sessions = self.get_sessions(
            start_date=start_date,
            end_date=end_date,
            source_lang=source_lang,
            target_lang=target_lang
        )
        
        export_data = {
            'export_date': datetime.now().isoformat(),
            'total_sessions': len(sessions),
            'filters': {
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None,
                'source_lang': source_lang,
                'target_lang': target_lang
            },
            'sessions': sessions
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        print(f"[Session Manager] Exported {len(sessions)} sessions to {output_path}")
        return len(sessions)
    
    def export_to_csv(self, output_path: str,
                     start_date: Optional[datetime] = None,
                     end_date: Optional[datetime] = None,
                     source_lang: Optional[str] = None,
                     target_lang: Optional[str] = None):
        """Export sessions to CSV file (flattened events)"""
        sessions = self.get_sessions(
            start_date=start_date,
            end_date=end_date,
            source_lang=source_lang,
            target_lang=target_lang
        )
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'session_id', 'session_start_time', 'session_status',
                'source_lang', 'target_lang', 'model_size', 'device',
                'event_timestamp', 'event_time_iso', 'source_text', 'translated_text',
                'stt_latency_ms', 'mt_latency_ms', 'tts_latency_ms', 'total_latency_ms'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            row_count = 0
            for session in sessions:
                for event in session['events']:
                    total_latency = (event['stt_latency_ms'] + 
                                   event['mt_latency_ms'] + 
                                   event['tts_latency_ms'])
                    
                    writer.writerow({
                        'session_id': session['session_id'],
                        'session_start_time': session['start_time_iso'],
                        'session_status': session['status'],
                        'source_lang': session['source_lang'],
                        'target_lang': session['target_lang'],
                        'model_size': session['model_size'],
                        'device': session['device'],
                        'event_timestamp': event['timestamp'],
                        'event_time_iso': datetime.fromtimestamp(event['timestamp']).isoformat(),
                        'source_text': event['source_text'],
                        'translated_text': event['translated_text'],
                        'stt_latency_ms': event['stt_latency_ms'],
                        'mt_latency_ms': event['mt_latency_ms'],
                        'tts_latency_ms': event['tts_latency_ms'],
                        'total_latency_ms': total_latency
                    })
                    row_count += 1
        
        print(f"[Session Manager] Exported {row_count} events to {output_path}")
        return row_count
    
    def print_session_summary(self, session_id: str):
        """Print a summary of a specific session"""
        session_file = self.sessions_dir / f"{session_id}.json"
        if not session_file.exists():
            session_file = self.archive_dir / f"{session_id}.json"
        
        if not session_file.exists():
            print(f"Session {session_id} not found")
            return
        
        with open(session_file, 'r') as f:
            session = json.load(f)
        
        print("\n" + "="*60)
        print(f"Session: {session['session_id']}")
        print("="*60)
        print(f"Status: {session['status']}")
        print(f"Start: {session['start_time_iso']}")
        if session['end_time_iso']:
            print(f"End: {session['end_time_iso']}")
            print(f"Duration: {session['duration_seconds']:.1f}s")
        print(f"Language: {session['source_lang']} → {session['target_lang']}")
        print(f"Model: {session['model_size']} ({session['device']}, {session['compute_type']})")
        print(f"Events: {session['event_count']}")
        
        if session['events']:
            latencies = [
                e['stt_latency_ms'] + e['mt_latency_ms'] + e['tts_latency_ms']
                for e in session['events']
            ]
            avg_latency = sum(latencies) / len(latencies)
            print(f"Average Latency: {avg_latency:.1f}ms")
        
        print("="*60 + "\n")
