param(
  [string]$TextPath = "docs\videos\teachplay-student-completion-walkthrough-narration.txt",
  [string]$OutPath = "docs\videos\teachplay-student-completion-walkthrough-narration.wav"
)

Add-Type -AssemblyName System.Speech

$text = Get-Content -LiteralPath $TextPath -Raw
$escaped = [System.Security.SecurityElement]::Escape($text)

$ssml = @"
<speak version="1.0" xml:lang="en-US">
  <voice name="Microsoft Zira Desktop">
    <prosody rate="-4%" pitch="+1%">
      $escaped
    </prosody>
  </voice>
</speak>
"@

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile((Resolve-Path -LiteralPath (Split-Path -Parent $OutPath)).Path + "\" + (Split-Path -Leaf $OutPath))
$synth.SpeakSsml($ssml)
$synth.Dispose()

