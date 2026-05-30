/** 配置分类优先，再追加作品中出现但未配置的视频 subcategory */
export function mergeVideoTabCategories(
  configured: string[],
  workSubcategories: Array<string | undefined>,
): string[] {
  const merged = [...configured];
  for (const raw of workSubcategories) {
    const name = raw?.trim();
    if (!name || merged.includes(name)) {
      continue;
    }
    merged.push(name);
  }
  return merged;
}
