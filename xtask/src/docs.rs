use html5ever::local_name;
use html5ever::namespace_url;
use html5ever::ns;
use html5ever::serialize::Serialize as HtmlSerialize;
use html5ever::serialize::Serializer as HtmlSerializer;
use html5ever::serialize::TraversalScope as HtmlTraversalScope;
use html5ever::LocalName;
use html5ever::QualName;
use pulldown_cmark as md;
use pulldown_cmark::OffsetIter as MdIter;
use std::borrow::Borrow;
use std::cmp::min;
use std::collections::{BTreeMap, HashMap};
use std::error::Error;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use url::Url;
use walkdir::WalkDir;

pub fn docs() -> Result<(), Box<dyn Error>> {
  let docs_root: PathBuf = fs::canonicalize("docs").unwrap();
  let docs_root = &docs_root;
  let docs_uri = Url::from_file_path(docs_root).unwrap();
  let docs_uri = &docs_uri;
  let input_files = load_input_files(docs_root).unwrap();
  let mut out_fragments: BTreeMap<Url, (String, HtmlDocument)> = BTreeMap::new();
  let mut meta: HashMap<Url, String> = HashMap::new();
  for (uri, md) in input_files.into_iter() {
    let dom = md_to_dom(&md);
    let short = get_short_path(docs_uri, &uri);
    meta.insert(uri.clone(), short.clone());
    out_fragments.insert(uri, (short, dom));
  }
  let meta = &meta;
  let mut switches = vec![HtmlNode::new_text(String::from(""))];
  for (uri, (short, mut dom)) in out_fragments.into_iter() {
    escape_angular(&mut dom);
    remap_links(docs_uri, meta, &uri, &mut dom);
    let mut ng_case_children = Vec::new();
    ng_case_children.push(HtmlNode::new_text(String::from("\n")));
    ng_case_children.extend(dom.children.into_iter());
    ng_case_children.push(HtmlNode::new_text(String::from("\n")));
    let escaped_short = serde_json::to_string(&short).unwrap();
    switches.push(HtmlNode::new_elem(
      "ng-container",
      vec![("*ngSwitchCase", escaped_short)],
      ng_case_children,
    ));
    switches.push(HtmlNode::new_text(String::from("\n")));
  }
  switches.push(HtmlNode::new_elem(
    "ng-container",
    vec![("*ngSwitchDefault", String::new())],
    vec![HtmlNode::new_elem(
      "etwin-docs-not-found",
      vec![("[path]", String::from("path"))],
      vec![],
    )],
  ));
  switches.push(HtmlNode::new_text(String::from("\n")));
  let container = HtmlNode::new_elem("ng-container", vec![("[ngSwitch]", String::from("path"))], switches);
  let dom = HtmlDocument::new(vec![container]);
  let html = dom_to_html(&dom);
  let out_path: PathBuf = fs::canonicalize("packages/website/src/app/docs/docs-content.component.html").unwrap();
  fs::write(out_path, html).unwrap();
  Ok(())
}

fn remap_links(root: &Url, meta: &HashMap<Url, String>, uri: &Url, dom: &mut HtmlDocument) {
  remap_document(root, meta, uri, dom);

  fn remap_document(root: &Url, meta: &HashMap<Url, String>, uri: &Url, node: &mut HtmlDocument) {
    remap_nodes(root, meta, uri, &mut node.children);
  }

  fn remap_nodes(root: &Url, meta: &HashMap<Url, String>, uri: &Url, node: &mut [HtmlNode]) {
    for n in node.iter_mut() {
      remap_node(root, meta, uri, n);
    }
  }

  fn remap_node(root: &Url, meta: &HashMap<Url, String>, uri: &Url, node: &mut HtmlNode) {
    match node {
      HtmlNode::Elem(e) => remap_elem(root, meta, uri, e),
      HtmlNode::Text(_) => {}
    }
  }

  fn remap_elem(root: &Url, meta: &HashMap<Url, String>, uri: &Url, node: &mut HtmlElem) {
    let (a_name, href_name, router_link_name) = {
      let dummy = HtmlElem::new(
        "a",
        vec![("href", String::new()), ("routerLink", String::new())],
        vec![],
      );
      (dummy.name, dummy.attrs[0].0.clone(), dummy.attrs[1].0.clone())
    };
    if node.name == a_name {
      for (name, value) in node.attrs.iter_mut() {
        if *name != href_name {
          continue;
        }
        let resolved = Url::options().base_url(Some(uri)).parse(value).unwrap();
        let resolved = &resolved;
        *value = match resolved.scheme() {
          "file" => {
            if let Some(short) = meta.get(resolved) {
              *name = router_link_name.clone();
              format!("/docs/{}", short)
            } else {
              eprintln!("Invalid link target: {}", resolved);
              String::new()
            }
          }
          "http" => value.clone(),
          "https" => value.clone(),
          _ => {
            eprintln!("Invalid link target: {}", resolved);
            String::new()
          }
        };
      }
    }
    remap_nodes(root, meta, uri, &mut node.children);
  }
}

fn escape_angular(dom: &mut HtmlDocument) {
  remap_document(dom);

  fn remap_document(node: &mut HtmlDocument) {
    remap_nodes(&mut node.children);
  }

  fn remap_nodes(node: &mut [HtmlNode]) {
    for n in node.iter_mut() {
      remap_node(n);
    }
  }

  fn remap_node(node: &mut HtmlNode) {
    match node {
      HtmlNode::Elem(n) => remap_elem(n),
      HtmlNode::Text(n) => remap_text(n),
    }
  }

  fn remap_elem(node: &mut HtmlElem) {
    remap_nodes(&mut node.children);
  }

  fn remap_text(node: &mut HtmlText) {
    if node.text.contains('{') {
      node.text = node.text.replace("{", "{{ \"{\" }}");
    }
  }
}

fn load_input_files(root: &Path) -> Result<HashMap<Url, String>, Box<dyn Error>> {
  assert!(root.is_absolute());
  let mut files = HashMap::new();

  let walker = WalkDir::new(root).into_iter();
  for entry in walker {
    let entry = entry.unwrap();
    if !entry.file_type().is_file() {
      continue;
    }
    let file_name = entry.file_name().to_str().unwrap();
    if !file_name.ends_with(".md") {
      continue;
    }
    let path = entry.path();
    assert!(path.is_absolute());
    let uri = Url::from_file_path(path).unwrap();
    let text = fs::read_to_string(path).unwrap();
    let old = files.insert(uri, text);
    debug_assert!(old.is_none());
  }

  Ok(files)
}

fn get_short_path(root: &Url, file: &Url) -> String {
  const SLASH_INDEX_DOT_MD: &str = "/index.md";
  const DOT_MD: &str = ".md";
  const DOT: &str = ".";
  const DOT_SLASH: &str = "./";

  let rel = relative_furi(root, file);
  let rel = &rel;
  assert!(rel.starts_with("./"));
  let rel = if rel.ends_with(SLASH_INDEX_DOT_MD) {
    &rel[..(rel.len() - SLASH_INDEX_DOT_MD.len())]
  } else if rel.ends_with(DOT_MD) {
    &rel[..(rel.len() - DOT_MD.len())]
  } else {
    rel
  };
  let rel = if let Some(r) = rel.strip_prefix(DOT_SLASH) {
    r
  } else if let Some(r) = rel.strip_prefix(DOT) {
    r
  } else {
    rel
  };
  String::from(rel)
}

fn relative_furi(from: &Url, to: &Url) -> String {
  assert_eq!(from.scheme(), "file");
  assert_eq!(to.scheme(), "file");
  if from == to {
    return String::from("");
  }
  if to.host_str() != from.host_str() {
    return to.to_string();
  }
  let mut from_segments: Vec<&str> = from.path_segments().unwrap().collect();
  if from_segments.len() >= 2 && from_segments.ends_with(&[""]) {
    from_segments.pop();
  }
  let from_segments = from_segments;
  let to_segments: Vec<&str> = to.path_segments().unwrap().collect();
  let mut shared_segments: usize = 0;
  for i in 0..min(from_segments.len(), to_segments.len()) {
    let from_segment = from_segments[i];
    let to_segment = to_segments[i];
    if from_segment == to_segment {
      shared_segments += 1;
    } else {
      break;
    }
  }
  let shared_segments = shared_segments;
  let mut out_segments: Vec<&str> = Vec::new();
  if shared_segments == from_segments.len() {
    if shared_segments == to_segments.len() {
      return String::from("");
    }
    out_segments.push(".");
  } else {
    out_segments.resize(out_segments.len() + (from_segments.len() - shared_segments), "..")
  }
  out_segments.extend(to_segments[shared_segments..].iter());
  out_segments.join("/")
}

fn md_to_dom(md: &str) -> HtmlDocument {
  let parser = md::Parser::new_ext(md, md::Options::ENABLE_STRIKETHROUGH | md::Options::ENABLE_TABLES);
  let mut children = Vec::new();
  let mut it = parser.into_offset_iter();
  let mut state = State { in_table: false };
  loop {
    match pull(&mut it, &mut state) {
      Ok(child) => children.push(child),
      Err(end) => {
        assert_eq!(end, None);
        break;
      }
    }
  }

  struct State {
    in_table: bool,
  }

  fn pull<'a>(it: &mut MdIter<'a>, state: &mut State) -> Result<HtmlNode, Option<md::Tag<'a>>> {
    let (ev, _range) = match it.next() {
      Some(s) => s,
      None => return Err(None),
    };
    match ev {
      md::Event::Code(text) => {
        let text = HtmlNode::new_text(text.into_string());
        let pre = HtmlNode::new_elem("code", vec![], vec![text]);
        Ok(pre)
      }
      md::Event::End(t) => Err(Some(t)),
      md::Event::SoftBreak => Ok(HtmlNode::new_text(String::from("\n"))),
      md::Event::Start(start) => {
        if matches!(&start, md::Tag::TableHead) {
          state.in_table = true;
        }
        let mut children: Vec<HtmlNode> = Vec::new();
        loop {
          match pull(it, state) {
            Ok(child) => children.push(child),
            Err(end) => {
              let end = end.expect("UnpairedStartEvent");
              assert_eq!(start, end);
              break;
            }
          }
        }
        if matches!(&start, md::Tag::TableHead) {
          state.in_table = false;
        }
        let name = match &start {
          md::Tag::BlockQuote => "blockquote",
          md::Tag::CodeBlock(_) => "pre", // TODOL Use `code` inside of `pre`
          md::Tag::Emphasis => "em",
          md::Tag::Heading(1) => "h1",
          md::Tag::Heading(2) => "h2",
          md::Tag::Heading(3) => "h3",
          md::Tag::Heading(4) => "h4",
          md::Tag::Heading(5) => "h5",
          md::Tag::Heading(6) => "h6",
          md::Tag::Item => "li",
          md::Tag::Link(..) => "a",
          md::Tag::List(None) => "ul",
          md::Tag::List(Some(_)) => "ol",
          md::Tag::Paragraph => "p",
          md::Tag::Strong => "strong",
          md::Tag::Table(_) => "table",
          md::Tag::TableCell => {
            if state.in_table {
              "th"
            } else {
              "td"
            }
          }
          md::Tag::TableHead => "tr",
          md::Tag::TableRow => "tr",
          t => panic!("Unexpected tag: {:?}", t),
        };
        let attrs = match start {
          md::Tag::Link(_ty, dest, _title) => vec![("href", dest.into_string())],
          _ => Vec::new(),
        };
        Ok(HtmlNode::new_elem(name, attrs, children))
      }
      md::Event::Text(text) => Ok(HtmlNode::new_text(text.into_string())),
      ev => panic!("Unexpected ev: {:?}", ev),
    }
  }

  HtmlDocument { children }
}

#[derive(Debug)]
struct HtmlDocument {
  children: Vec<HtmlNode>,
}

impl HtmlDocument {
  fn new(children: Vec<HtmlNode>) -> Self {
    Self { children }
  }
}

#[derive(Debug)]
struct HtmlNodeSlice<'a>(&'a [HtmlNode]);

impl<'a> HtmlNodeSlice<'a> {
  pub fn new(nodes: &'a [HtmlNode]) -> Self {
    Self(nodes)
  }
}

impl HtmlSerialize for HtmlDocument {
  fn serialize<S>(&self, serializer: &mut S, traversal_scope: HtmlTraversalScope) -> io::Result<()>
  where
    S: HtmlSerializer,
  {
    HtmlNodeSlice::new(&self.children).serialize(serializer, traversal_scope)
  }
}

#[derive(Debug)]
enum HtmlNode {
  Elem(HtmlElem),
  Text(HtmlText),
}

impl HtmlNode {
  pub fn new_elem(name: &'static str, attrs: Vec<(&'static str, String)>, children: Vec<HtmlNode>) -> Self {
    Self::Elem(HtmlElem::new(name, attrs, children))
  }

  pub fn new_text(text: String) -> Self {
    Self::Text(HtmlText::new(text))
  }
}

impl HtmlSerialize for HtmlNode {
  fn serialize<S>(&self, serializer: &mut S, traversal_scope: HtmlTraversalScope) -> io::Result<()>
  where
    S: HtmlSerializer,
  {
    match self {
      Self::Elem(n) => n.serialize(serializer, traversal_scope),
      Self::Text(n) => n.serialize(serializer, traversal_scope),
    }
  }
}

impl HtmlSerialize for HtmlNodeSlice<'_> {
  fn serialize<S>(&self, serializer: &mut S, traversal_scope: HtmlTraversalScope) -> io::Result<()>
  where
    S: HtmlSerializer,
  {
    for n in self.0.iter() {
      n.serialize(serializer, traversal_scope.clone())?
    }
    Ok(())
  }
}

fn to_local_name(name: &'static str) -> LocalName {
  match name {
    "a" => local_name!("a"),
    "code" => local_name!("code"),
    "em" => local_name!("em"),
    "h1" => local_name!("h1"),
    "h2" => local_name!("h2"),
    "h3" => local_name!("h3"),
    "h4" => local_name!("h4"),
    "h5" => local_name!("h5"),
    "h6" => local_name!("h6"),
    "li" => local_name!("li"),
    "ol" => local_name!("ol"),
    "p" => local_name!("p"),
    "pre" => local_name!("pre"),
    "strong" => local_name!("strong"),
    "table" => local_name!("table"),
    "td" => local_name!("td"),
    "th" => local_name!("th"),
    "thead" => local_name!("thead"),
    "tr" => local_name!("tr"),
    "ul" => local_name!("ul"),
    _ => LocalName::from(name),
  }
}

#[derive(Debug)]
struct HtmlElem {
  name: QualName,
  attrs: Vec<(QualName, String)>,
  children: Vec<HtmlNode>,
}

impl HtmlElem {
  pub fn new(name: &'static str, attrs: Vec<(&'static str, String)>, children: Vec<HtmlNode>) -> Self {
    let local = to_local_name(name);
    let attrs: Vec<(QualName, String)> = attrs
      .iter()
      .map(|(name, value)| (QualName::new(None, ns!(), to_local_name(name)), value.clone()))
      .collect();
    Self {
      name: QualName {
        prefix: None,
        ns: ns!(html),
        local,
      },
      attrs,
      children,
    }
  }
}

impl HtmlSerialize for HtmlElem {
  fn serialize<S>(&self, serializer: &mut S, traversal_scope: HtmlTraversalScope) -> io::Result<()>
  where
    S: HtmlSerializer,
  {
    serializer.start_elem(
      self.name.clone(),
      self.attrs.iter().map(|(name, val)| (name, val.as_str())),
    )?;
    HtmlNodeSlice::new(&self.children).serialize(serializer, traversal_scope)?;
    serializer.end_elem(self.name.clone())?;
    Ok(())
  }
}

#[derive(Debug)]
struct HtmlText {
  text: String,
}

impl HtmlText {
  pub fn new(text: String) -> Self {
    Self { text }
  }
}

impl HtmlSerialize for HtmlText {
  fn serialize<S>(&self, serializer: &mut S, _traversal_scope: HtmlTraversalScope) -> io::Result<()>
  where
    S: HtmlSerializer,
  {
    serializer.write_text(self.text.borrow())?;
    Ok(())
  }
}

fn dom_to_html(dom: &HtmlDocument) -> String {
  let mut writer = Vec::<u8>::new();
  let opts = html5ever::serialize::SerializeOpts::default();
  html5ever::serialize(&mut writer, dom, opts).unwrap();
  String::from_utf8(writer).unwrap()
}
