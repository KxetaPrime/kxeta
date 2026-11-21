#!/usr/bin/env python3
"""Monta Etiqueta-Bonita.html (arquivo único, funciona offline) a partir do template.

Precisa das bibliotecas na pasta node_modules ao lado deste arquivo:
    npm i pdfjs-dist@3.11.174 pdf-lib@1.17.1
    python3 build.py
"""
from pathlib import Path

d = Path(__file__).resolve().parent

def lib(rel):
    return (d / "node_modules" / rel).read_text(encoding="utf-8").replace("</script", "<\\/script")

t = (d / "template.html").read_text(encoding="utf-8")
t = t.replace("/*PDFJS*/", lib("pdfjs-dist/build/pdf.min.js"))
t = t.replace("/*PDFJSWORKER*/", lib("pdfjs-dist/build/pdf.worker.min.js"))
t = t.replace("/*PDFLIB*/", lib("pdf-lib/dist/pdf-lib.min.js"))
(d / "Etiqueta-Bonita.html").write_text(t, encoding="utf-8")
print("Etiqueta-Bonita.html gerado")
