# Patient PDF font

`NotoSansJP-Regular.ttf` is a full Japanese font embedded locally in patient PDFs.
It is derived from the weight-400 instance of Google Fonts' Noto Sans JP variable
font using `fonttools varLib.instancer`. No glyph subset is applied.

Source: https://github.com/google/fonts/tree/main/ofl/notosansjp
License: SIL Open Font License 1.1, in `OFL.txt`.

The font is loaded from this app's own origin only when PDF export is requested.
No patient content is sent to a font provider or PDF conversion service.
