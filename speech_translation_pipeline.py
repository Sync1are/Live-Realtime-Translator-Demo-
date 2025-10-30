"""
NOTICE: This file has been moved to the legacy/ folder.

The Python-based speech translation demo has been relocated as part of
the Electron desktop application bootstrap.

Please see:
- legacy/speech_translation_pipeline.py - The main translation pipeline
- legacy/README.md - Full documentation for the Python demo

The new Electron + React + TypeScript desktop application is located in:
- app/ - The new desktop application
- README.md - Documentation for the desktop app

To run the legacy Python demo:
    cd legacy/
    python speech_translation_pipeline.py --src-lang en --tgt-lang de

To run the new desktop app:
    npm install
    npm run dev
"""

if __name__ == "__main__":
    print(__doc__)
    print("\n" + "=" * 70)
    print("The Python demo has been moved to the legacy/ folder.")
    print("=" * 70)
