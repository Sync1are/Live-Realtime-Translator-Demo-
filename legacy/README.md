# Ultra-Low-Latency Real-Time Speech Translation Pipeline

![Python 3.8+](https://img.shields.io/badge/python-3.8%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A production-ready real-time speech translation system that captures audio from your microphone, transcribes it using Faster-Whisper, translates it via MarianMT, and speaks the result—all with sub-second latency. Built with acoustic echo cancellation to prevent feedback loops.

## 🎯 Features

- **Real-time VAD**: WebRTC Voice Activity Detection with adaptive chunking
- **Fast STT**: Faster-Whisper streaming transcription with model warm-up
- **Neural Translation**: Helsinki-NLP MarianMT models with context awareness
- **TTS Integration**: Thread-safe pyttsx3 text-to-speech with echo gating
- **Acoustic Echo Cancellation**: Intelligent mic muting during playback to prevent feedback
- **Multi-threaded Pipeline**: Concurrent workers with bounded queues for stability
- **GPU Support**: Optional CUDA acceleration for lower latency
- **Flexible Configuration**: CLI arguments for language pairs, model size, and device selection
- **Session Recording**: Automatic recording of translation sessions with performance metrics
- **History & Archive**: Browse past sessions with filtering and archival capabilities
- **Export Support**: Export sessions to CSV or JSON for analysis and backup

## 📋 Requirements

- **Python**: 3.8 or higher
- **Audio**: Working microphone accessible to Python
- **OS**: Windows, macOS, or Linux
- **GPU** (optional): CUDA-compatible GPU for faster transcription

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Sync1are/Live-Realtime-Translator-Demo-.git
cd speech-translation-pipeline
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install faster-whisper webrtcvad pyaudio transformers torch pyttsx3 tabulate
```

### Platform-Specific PyAudio Installation

**Windows:**
```bash
pip install pipwin
pipwin install pyaudio
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install portaudio19-dev python3-pyaudio
pip install pyaudio
```

**macOS:**
```bash
brew install portaudio
pip install pyaudio
```

### 3. Optional: GPU Support

For CUDA acceleration (requires NVIDIA GPU):

```bash
# Install CUDA-enabled PyTorch (visit pytorch.org for your system)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## 🎬 Quick Start

### Basic Usage (CPU)

```bash
python speech_translation_pipeline.py --src-lang en --tgt-lang de --model-size base
```

This will:
1. Start listening to your microphone
2. Transcribe English speech
3. Translate to German
4. Speak the translation aloud

**Press Ctrl+C to stop.**

### GPU Acceleration

```bash
python speech_translation_pipeline.py \
  --src-lang en \
  --tgt-lang de \
  --model-size base \
  --device cuda \
  --compute-type fp16
```

### Auto-Detect Source Language

```bash
python speech_translation_pipeline.py \
  --src-lang auto \
  --tgt-lang de \
  --model-size base
```

### Run for Limited Time

```bash
# Run for 60 seconds then stop
python speech_translation_pipeline.py \
  --src-lang en \
  --tgt-lang es \
  --duration 60
```

## 🔧 Configuration Options

| Argument | Options | Default | Description |
|----------|---------|---------|-------------|
| `--src-lang` | `en`, `de`, `es`, `fr`, `auto`, etc. | `en` | Source language code or `auto` for detection |
| `--tgt-lang` | `de`, `es`, `fr`, `en`, etc. | `de` | Target language code |
| `--model-size` | `tiny`, `base`, `small`, `medium` | `base` | Whisper model size (smaller = faster, less accurate) |
| `--device` | `cpu`, `cuda` | `cpu` | Compute device |
| `--compute-type` | `int8`, `fp16`, `float32` | `int8` | Model precision (int8 for CPU, fp16 for GPU) |
| `--duration` | Any integer | `60` | Run duration in seconds (0 = infinite) |
| `--no-record` | flag | `False` | Disable session recording |

## 📚 Usage Examples

### Example 1: English to German (Fast, CPU)

```bash
python speech_translation_pipeline.py \
  --src-lang en \
  --tgt-lang de \
  --model-size tiny \
  --device cpu \
  --compute-type int8
```

### Example 2: Spanish to English (GPU, High Quality)

```bash
python speech_translation_pipeline.py \
  --src-lang es \
  --tgt-lang en \
  --model-size small \
  --device cuda \
  --compute-type fp16
```

### Example 3: Auto-Detect with Continuous Running

```bash
python speech_translation_pipeline.py \
  --src-lang auto \
  --tgt-lang de \
  --model-size base \
  --duration 0
```

### Example 4: French to German (Balanced)

```bash
python speech_translation_pipeline.py \
  --src-lang fr \
  --tgt-lang de \
  --model-size base \
  --device cpu
```

## 🏗️ Architecture

### Pipeline Overview

```
Microphone → VAD Chunker → STT Worker → Translation Worker → TTS Worker → Speaker
              (Queue)        (Queue)         (Queue)
```

### Components

1. **VADChunker Thread**
   - Captures audio from microphone at 16kHz mono
   - Applies WebRTC Voice Activity Detection
   - Creates variable-length speech chunks (200-900ms)
   - Implements echo gate to ignore mic during TTS playback

2. **STTWorker Thread**
   - Runs Faster-Whisper transcription
   - Warm-up phase for reduced first-chunk latency
   - Automatic punctuation addition
   - Language detection support

3. **TranslationWorker Thread**
   - Helsinki-NLP MarianMT translation
   - Context window (last 150 chars) for coherence
   - Deduplication to avoid repeated translations
   - Adjustable beam search for quality

4. **TTSWorker Thread**
   - Thread-safe pyttsx3 TTS manager
   - Sequential speech queue
   - Acoustic echo cancellation gate
   - Configurable speech rate

### Acoustic Echo Cancellation

The pipeline includes a built-in AEC mechanism:
- TTS manager signals when speaking
- VAD ignores microphone input during playback
- 300ms post-speech delay for acoustic decay
- Prevents the system from translating its own output

## 📊 Session History, Archive & Export

### Session Recording

By default, all translation sessions are automatically recorded with:
- Source and translated text for each event
- Performance metrics (STT, MT, TTS latency)
- Session metadata (language pair, model, device)
- Start/end timestamps

Session data is stored in `~/.speech_translation/sessions/`.

To disable recording, use the `--no-record` flag:

```bash
python speech_translation_pipeline.py --src-lang en --tgt-lang de --no-record
```

### Viewing Session History

Use the `history_viewer.py` tool to browse past sessions:

#### List All Sessions

```bash
python history_viewer.py list
```

#### Filter Sessions

```bash
# Sessions from last 7 days
python history_viewer.py list --last-days 7

# Filter by language pair
python history_viewer.py list --source-lang en --target-lang de

# Filter by status
python history_viewer.py list --status completed

# Filter by date range
python history_viewer.py list --start-date 2024-01-01 --end-date 2024-01-31
```

#### View Session Details

```bash
python history_viewer.py show <session_id>
```

This displays:
- Session metadata and duration
- Event count and average latency
- Recent translation events with individual latencies

### Archiving Sessions

Archive old completed sessions to keep your active session list clean while preserving data.

#### Auto-Archive

By default, sessions older than 30 days are eligible for archiving. To archive them:

```bash
python history_viewer.py archive
```

#### Custom Threshold

Archive sessions older than a specific number of days:

```bash
# Archive sessions older than 90 days
python history_viewer.py archive --threshold-days 90
```

#### Unarchive Sessions

Restore archived sessions back to active status:

```bash
python history_viewer.py unarchive <session_id>
```

Archived sessions are stored in `~/.speech_translation/archive/` and can still be viewed, exported, and searched.

### Exporting Sessions

Export session data for backup, analysis, or integration with other tools.

#### Export to JSON

```bash
# Export all sessions
python history_viewer.py export sessions.json --format json

# Export sessions from last 30 days
python history_viewer.py export recent_sessions.json --format json --last-days 30

# Export with filters
python history_viewer.py export en_de_sessions.json --format json \
  --source-lang en --target-lang de --start-date 2024-01-01
```

**JSON Format:**
- Includes complete session metadata
- Nested structure with all events
- Contains performance metrics and timestamps
- Suitable for re-import or programmatic analysis

#### Export to CSV

```bash
# Export all events to CSV
python history_viewer.py export sessions.csv --format csv

# Export filtered data
python history_viewer.py export last_week.csv --format csv --last-days 7
```

**CSV Format:**
- One row per translation event
- Flattened structure for spreadsheet analysis
- Includes session context in each row
- Contains individual and total latency metrics

**CSV Fields:**
- `session_id`: Unique session identifier
- `session_start_time`: Session start timestamp (ISO format)
- `session_status`: Session status (active/completed/archived)
- `source_lang`: Source language code
- `target_lang`: Target language code
- `model_size`: Whisper model size used
- `device`: Compute device (cpu/cuda)
- `event_timestamp`: Event timestamp (Unix time)
- `event_time_iso`: Event time (ISO format)
- `source_text`: Original transcribed text
- `translated_text`: Translated text
- `stt_latency_ms`: Speech-to-text latency in milliseconds
- `mt_latency_ms`: Machine translation latency in milliseconds
- `tts_latency_ms`: Text-to-speech latency in milliseconds
- `total_latency_ms`: Total end-to-end latency

### Configuration

Session manager configuration is stored in `~/.speech_translation/config.json`:

```json
{
  "archive_threshold_days": 30,
  "auto_archive": true
}
```

You can manually edit this file to change default behavior.

### Additional Documentation

For more detailed information about history and export features:
- **[Complete Guide](HISTORY_AND_EXPORT_GUIDE.md)**: Comprehensive documentation with examples and use cases
- **[Quick Reference](QUICK_REFERENCE.md)**: Command cheat sheet for common tasks

## ⚙️ Advanced Configuration

### Latency Tuning

Edit these constants in the script for fine-tuning:

```python
FRAME_MS = 30              # VAD frame duration (ms)
CHUNK_MIN_MS = 200         # Minimum chunk length (ms)
CHUNK_TARGET_MS = 900      # Target chunk length (ms)
VAD_AGGR = 2               # VAD aggressiveness (0-3)
QUEUE_SIZE = 8             # Worker queue depth
```

**For Lower Latency:**
- Use `--model-size tiny`
- Reduce `CHUNK_TARGET_MS` to 700-800
- Use GPU with `--compute-type fp16`
- Reduce beam size in translation worker

**For Higher Quality:**
- Use `--model-size small` or `medium`
- Increase beam size to 4-5
- Increase context window size
- Use cleaner audio input (headset mic)

### Supported Language Pairs

The script uses Helsinki-NLP OPUS-MT models. Common pairs:

| Source | Target | Model Name |
|--------|--------|------------|
| English | German | `opus-mt-en-de` |
| English | Spanish | `opus-mt-en-es` |
| English | French | `opus-mt-en-fr` |
| German | English | `opus-mt-de-en` |
| Spanish | English | `opus-mt-es-en` |

**Note:** For non-English source languages, you may need to modify the model loading logic in `TranslationWorker.__init__()`.

## 🐛 Troubleshooting

### No Audio Input

**Problem:** Script doesn't detect microphone

**Solutions:**
- Check microphone permissions in OS settings
- List available devices: `python -m sounddevice`
- Specify device index in `pyaudio.open()` if needed
- Ensure microphone is set as default input device

### PyAudio Installation Fails

**Problem:** `pip install pyaudio` errors

**Solutions:**
- **Windows:** Use `pipwin install pyaudio`
- **Linux:** Install `portaudio19-dev` package first
- **macOS:** `brew install portaudio` first
- Try pre-built wheels from [Unofficial Windows Binaries](https://www.lfd.uci.edu/~gohlke/pythonlibs/)

### Empty or Choppy Transcriptions

**Problem:** VAD not detecting speech properly

**Solutions:**
- Reduce background noise
- Speak louder or closer to mic
- Lower `VAD_AGGR` from 2 to 1
- Check mic sample rate is 16kHz
- Verify `CHUNK_MIN_MS` isn't too high

### TTS Feedback Loop

**Problem:** System translates its own speech

**Solutions:**
- Use headphones instead of speakers
- Ensure echo gate is enabled (check console logs)
- Increase post-TTS delay in `TTSManager._worker()`
- Reduce speaker volume

### High CPU Usage

**Problem:** 100% CPU usage during transcription

**Solutions:**
- Use smaller model: `--model-size tiny`
- Enable GPU: `--device cuda`
- Use int8 quantization: `--compute-type int8`
- Close other applications

### CUDA Out of Memory

**Problem:** GPU runs out of VRAM

**Solutions:**
- Use smaller model size
- Reduce `QUEUE_SIZE` to prevent batch buildup
- Use `--compute-type int8` instead of `fp16`
- Check GPU memory: `nvidia-smi`

### Translation Quality Issues

**Problem:** Poor translation accuracy

**Solutions:**
- Use larger model: `--model-size small`
- Increase beam size in `TranslationWorker`
- Expand context window beyond 150 chars
- Ensure proper punctuation in transcripts
- Verify correct language pair model exists

## 📊 Performance Benchmarks

Tested on Intel i7-10700K (CPU) and RTX 3060 (GPU):

| Model | Device | Compute | Median Latency | Quality |
|-------|--------|---------|----------------|---------|
| tiny | CPU | int8 | ~600ms | Fair |
| base | CPU | int8 | ~900ms | Good |
| base | GPU | fp16 | ~400ms | Good |
| small | GPU | fp16 | ~650ms | Very Good |

*Latency measured from end-of-speech to TTS start*

## 🔐 Security & Privacy

- All processing runs **locally** on your machine
- No internet connection required after model downloads
- Audio is not recorded or transmitted
- Models are cached in `~/.cache/huggingface/`

## 🛠️ Development

### Project Structure

```
speech-translation-pipeline/
├── speech_translation_pipeline.py    # Main translation pipeline
├── session_manager.py                # Session recording and management
├── history_viewer.py                 # History browser and export tool
├── README.md                         # This file
├── requirements.txt                  # Dependencies
└── LICENSE                          # License file
```

### Adding New Language Pairs

1. Check available models: https://huggingface.co/Helsinki-NLP
2. Modify `TranslationWorker.__init__()`:
   ```python
   model_name = f"Helsinki-NLP/opus-mt-{evt['lang_src']}-{self.tgt_lang}"
   ```
3. Test with `--src-lang` matching your new source language

### Extending TTS

Replace pyttsx3 with alternatives:

- **Coqui TTS**: Higher quality neural voices
- **gTTS**: Google TTS (requires internet)
- **Azure Cognitive Services**: Cloud TTS
- **ElevenLabs**: Premium neural voices

Maintain the `TTSManager.is_speaking()` gate for echo cancellation.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Faster-Whisper](https://github.com/guillaumekln/faster-whisper) - High-performance Whisper implementation
- [Helsinki-NLP](https://huggingface.co/Helsinki-NLP) - OPUS-MT translation models
- [WebRTC VAD](https://github.com/wiseman/py-webrtcvad) - Voice activity detection
- [pyttsx3](https://github.com/nateshmbhat/pyttsx3) - Cross-platform TTS

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/speech-translation-pipeline/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/speech-translation-pipeline/discussions)

## 🗺️ Roadmap

- [x] Recording/playback of sessions ✅
- [x] Session history and archival ✅
- [x] Export to CSV/JSON ✅
- [ ] WebSocket server for remote access
- [ ] Web UI for configuration
- [ ] Multiple concurrent language pairs
- [ ] Custom TTS voice selection
- [ ] Mobile app integration
- [ ] Docker container support
- [ ] Kubernetes deployment configs

---

**Made with ❤️ for the open source community**
