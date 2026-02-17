"""
TTS Video Maker - TTS Engine
Text-to-Speech with word-level timing using edge-tts
"""

import os
import sys
import re
import subprocess
import tempfile
from pathlib import Path


class TTSEngine:
    def __init__(self, voice='en-US-AriaNeural', speed=1.0):
        self.voice = voice
        self.speed = speed
        self.temp_dir = tempfile.gettempdir()

    def set_voice(self, voice):
        """Change TTS voice"""
        self.voice = voice

    def set_speed(self, speed):
        """Change TTS speed (0.5 - 2.0)"""
        self.speed = max(0.5, min(2.0, speed))

    def generate_audio_with_timing(self, text, output_path=None):
        """
        Generate audio AND word timing from text using edge-tts
        Returns: (audio_path, word_timings) where word_timings is list of (word, start, end)
        """
        if not text or not text.strip():
            return None, []

        if output_path is None:
            output_path = os.path.join(
                self.temp_dir,
                f"tts_{hash(text) % 100000}.mp3"
            )

        # VTT subtitle path
        vtt_path = output_path.replace('.mp3', '.vtt')

        # Calculate speed string for edge-tts
        speed_percent = int((self.speed - 1) * 100)
        speed_str = f"+{speed_percent}%" if speed_percent >= 0 else f"{speed_percent}%"

        # Use sys.executable to run edge_tts as module (works on Windows)
        # --write-subtitles gives us word-level timing!
        cmd = [
            sys.executable, '-m', 'edge_tts',
            '--voice', self.voice,
            '--rate', speed_str,
            '--text', text,
            '--write-media', output_path,
            '--write-subtitles', vtt_path
        ]

        try:
            result = subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True,
                encoding='utf-8'
            )

            # Convert MP3 to WAV for correct duration
            wav_path = output_path.replace('.mp3', '.wav')
            subprocess.run([
                'ffmpeg', '-y',
                '-i', output_path,
                '-ac', '2', '-ar', '44100',
                wav_path
            ], check=True, capture_output=True)

            if os.path.exists(wav_path):
                # Update output_path to point to WAV
                output_path = wav_path

            word_timings = []
            if os.path.exists(vtt_path):
                word_timings = self.parse_vtt(vtt_path)

            if os.path.exists(output_path):
                return output_path, word_timings
            return None, []

        except subprocess.CalledProcessError as e:
            print(f"TTS Error: {e.stderr}")
            return None, []
        except Exception as e:
            print(f"TTS Error: {e}")
            return None, []

    def parse_vtt(self, vtt_path):
        """
        Parse VTT file to extract word timings
        Returns: list of (word, start_seconds, end_seconds)
        """
        word_timings = []

        try:
            with open(vtt_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # VTT format:
            # 00:00:00.000 --> 00:00:00.500
            # word

            pattern = r'(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*\n(.+?)(?=\n\n|\n\d|\Z)'

            matches = re.findall(pattern, content, re.DOTALL)

            for match in matches:
                h1, m1, s1, ms1 = int(match[0]), int(match[1]), int(match[2]), int(match[3])
                h2, m2, s2, ms2 = int(match[4]), int(match[5]), int(match[6]), int(match[7])
                word = match[8].strip()

                start = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000
                end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000

                if word:
                    word_timings.append((word, start, end))

        except Exception as e:
            print(f"VTT parse error: {e}")

        return word_timings

    def generate_audio(self, text, output_path=None):
        """
        Generate audio from text (backward compatible)
        Returns: path to audio file if successful, None otherwise
        """
        audio_path, _ = self.generate_audio_with_timing(text, output_path)
        return audio_path

    def get_audio_duration(self, audio_path):
        """Get audio file duration in seconds"""
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            audio_path
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            return float(result.stdout.strip())
        except:
            return 3.0  # Default fallback

    @staticmethod
    def list_voices():
        """List available TTS voices"""
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'edge_tts', '--list-voices'],
                capture_output=True,
                text=True,
                encoding='utf-8'
            )
            return result.stdout
        except:
            return "Could not list voices. Make sure edge-tts is installed."


# CLI usage: python tts_engine.py "text" [output.mp3] [--voice vi-VN-HoaiMyNeural] [--speed 1.0]
if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='TTS Engine')
    parser.add_argument('text', help='Text to speak')
    parser.add_argument('--output', '-o', help='Output file path')
    parser.add_argument('--voice', '-v', default='vi-VN-HoaiMyNeural', help='TTS voice')
    parser.add_argument('--speed', '-s', type=float, default=1.0, help='Speech speed')
    parser.add_argument('--list-voices', action='store_true', help='List voices')

    args = parser.parse_args()

    engine = TTSEngine(voice=args.voice, speed=args.speed)

    if args.list_voices:
        print(engine.list_voices())
        sys.exit(0)

    audio_path = engine.generate_audio(args.text, args.output)
    if audio_path:
        print(f"OK:{audio_path}")
    else:
        print("ERROR:Failed to generate audio")
        sys.exit(1)
