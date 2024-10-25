
interface CategoryTagProps {
  categoryName: string;
  categoryId: number;
  className?: string;
}

export const CategoriesTag = (props: CategoryTagProps) => {
  const { categoryName, categoryId, className } = props;

  const getCategoryColor = (categoryId: number) => {
    const colors = {
      1: "bg-gray-400/5 text-gray-400 border-gray-400",
      2: "bg-orange-500/5 text-orange-500 border-orange-500",
      3: "bg-emerald-500/5 text-emerald-500 border-emerald-500",
      4: "bg-blue-500/5 text-blue-500 border-blue-500",
      5: "bg-pink-500/5 text-pink-500 border-pink-500",
      6: "bg-yellow-500/5 text-yellow-500 border-yellow-500",
    }
    return colors[categoryId as keyof typeof colors] || colors[1];
  }

  const renderCategoryTag = ({ categoryName, categoryId, className }: CategoryTagProps) => {
    return (
      <span className={`px-3 text-sm border rounded-full text-nowrap uppercase ${className ?? ""} ${getCategoryColor(categoryId)}`}>
        {categoryName}
      </span>
    )
  }

  return (
    renderCategoryTag({ categoryName, categoryId, className })
  )
}