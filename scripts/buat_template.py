# Membuat template.pptx bersih bertoken dari PPT asli
import re, sys, zipfile, shutil, os
src, dst = sys.argv[1], sys.argv[2]
z = zipfile.ZipFile(src)
files = {n: z.read(n) for n in z.namelist()}

def tok_shape(xml, name, token, sz_token=None):
    pat = re.compile(r'(<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="%s"[^>]*?/?>.*?</p:sp>)' % re.escape(name), re.S)
    m = pat.search(xml); assert m, name
    sp = m.group(1)
    p = re.search(r'<a:p>(.*?)</a:p>', sp.split('<p:txBody>')[1], re.S).group(0)
    rpr = re.search(r'<a:rPr[^>]*/>|<a:rPr[^>]*[^/]>.*?</a:rPr>', p, re.S).group(0)
    rpr = rpr.replace(' err="1"', '')
    if sz_token: rpr = re.sub(r'sz="\d+"', 'sz="%s"' % sz_token, rpr, count=1)
    ppr = re.search(r'<a:pPr[^>]*/>|<a:pPr[^>]*[^/]>.*?</a:pPr>', p, re.S)
    newp = '<a:p>%s<a:r>%s<a:t>%s</a:t></a:r></a:p>' % (ppr.group(0) if ppr else '', rpr, token)
    sp2 = sp.replace(p, newp, 1)
    return xml.replace(sp, sp2)

s2 = files['ppt/slides/slide2.xml'].decode()
for name, tok, sz in [('Nama Lengkap','{{NAMA}}','{{SZ_NAMA}}'),('Tempat Tanggal Lahir','{{TTL}}','{{SZ_TTL}}'),
                      ('Nilai IPK','{{IPK}}',None),('Nama Ayah','{{AYAH}}','{{SZ_AYAH}}'),('Nama Ibu','{{IBU}}','{{SZ_IBU}}'),
                      ('Quote','{{QUOTE}}','{{SZ_QUOTE}}'),('Nomor Urut','{{NO}}',None)]:
    s2 = tok_shape(s2, name, tok, sz)
# placeholder foto -> penanda
s2 = re.sub(r'<p:sp><p:nvSpPr><p:cNvPr id="\d+" name="Picture Placeholder 30".*?</p:sp>', '{{FOTO}}', s2, flags=re.S)
assert '{{FOTO}}' in s2

s1 = files['ppt/slides/slide1.xml'].decode()
s1 = s1.replace('JURUSAN ………………………','{{JURUSAN}}').replace('PROGRAM STUDI ……………………..','{{PRODI}}').replace('TAHUN 2026','TAHUN {{TAHUN}}')
s5 = files['ppt/slides/slide5.xml'].decode().replace('Makassar Tahun 2026','Makassar Tahun {{TAHUN}}')
for t in ['{{JURUSAN}}','{{PRODI}}','{{TAHUN}}']: assert t in s1, t
assert '{{TAHUN}}' in s5

def strip_notes(rels):
    return re.sub(r'<Relationship [^>]*notesSlide[^>]*/>', '', rels)

out = {}
for n, b in files.items():
    if n.startswith('ppt/notesSlides/') or n.startswith('ppt/slides/'): continue
    out[n] = b
out['ppt/slides/slide1.xml'] = s1.encode()
out['ppt/slides/slide2.xml'] = s2.encode()
out['ppt/slides/slide3.xml'] = s5.encode()
for a, b in [(1,1),(2,2),(5,3)]:
    out['ppt/slides/_rels/slide%d.xml.rels' % b] = strip_notes(files['ppt/slides/_rels/slide%d.xml.rels' % a].decode()).encode()

ct = files['[Content_Types].xml'].decode()
ct = re.sub(r'<Override PartName="/ppt/(notesSlides/notesSlide\d|slides/slide[45])\.xml"[^>]*/>', '', ct)
out['[Content_Types].xml'] = ct.encode()
pr = files['ppt/_rels/presentation.xml.rels'].decode()
pr = re.sub(r'<Relationship Id="rId[345]" [^>]*/>', '', pr)
pr = pr.replace('Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide5.xml"',
                'Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"')
pr = pr.replace('<Relationship Id="rId6"', '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/><Relationship Id="rId6"',1)
out['ppt/_rels/presentation.xml.rels'] = pr.encode()
p = files['ppt/presentation.xml'].decode()
p = re.sub(r'<p:sldIdLst>.*?</p:sldIdLst>', '<p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId3"/><p:sldId id="258" r:id="rId6"/></p:sldIdLst>', p)
out['ppt/presentation.xml'] = p.encode()
out['docProps/app.xml'] = b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Office PowerPoint</Application><PresentationFormat>Widescreen</PresentationFormat><Slides>3</Slides></Properties>'
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as w:
    w.writestr('[Content_Types].xml', out.pop('[Content_Types].xml'))
    for n, b in out.items(): w.writestr(n, b)
print('ok', dst)
