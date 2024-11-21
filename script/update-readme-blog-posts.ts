import { readFileSync, writeFileSync } from "node:fs";

main();

type Post = {
  title: string;
  oid: string;
  pub_date: string;
  categories: string[];
  comments: number;
};

const DRYRUN = Boolean(JSON.parse(process.env.DRYRUN ?? "false"));

async function main() {
  const response = await fetch("https://www.peterbe.com/api/v1/plog/homepage");
  if (!response.ok) {
    throw new Error(`${response.status} trying to fetch ${response.url}`);
  }
  const { posts } = (await response.json()) as { posts: Post[] };

  const readme = getReadme();

  const spaceRex = /(<!-- blog posts -->)(.|\n)*(<!-- \/blog posts -->)/;

  const newContent = makeLinksMarkdown(posts);

  const newReadme = readme.replace(spaceRex, `$1\n${newContent}\n$3`);
  if (DRYRUN) {
    console.log("NEW README__________________________________________________");
    console.log(newReadme);
  } else {
    saveReadme(newReadme);
  }
}

function getReadme() {
  return readFileSync("README.md", "utf-8");
}
function saveReadme(text: string) {
  writeFileSync("README.md", text, "utf-8");
}

function makeLinksMarkdown(posts: Post[]) {
  return posts.map(makeLinkMarkdown).join("\n\n");
}

function makeLinkMarkdown(post: Post) {
  let md = `[**${post.title}**](https://www.peterbe.com/plog/${post.oid})`;
  md += "<br>\n";
  md += formatDateBasic(post.pub_date);
  md += " &middot; ";
  md += post.categories.map(makeCategoryLink).join(", ");
  md += ` ${post.comments} ${post.comments === 1 ? "comment" : "comments"}`;
  return md.trim();
}

function formatDateBasic(date: string) {
  return new Date(date).toLocaleDateString("en-us", {
    year: "numeric",
    month: "long",
    day: "numeric",
    // This is important. This way, when it "rounds" the date,
    // it does it in a conistent way.
    timeZone: "UTC",
  });
}

function makeCategoryLink(category: string) {
  return `[${category}](https://www.peterbe.com/oc-${category.replaceAll(
    " ",
    "+"
  )})`;
}
