import { Card } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import type { Category } from "../../../drizzle/schema";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
  categoryType?: "special" | "place" | "situation" | "weather";
}

export function CategoryCard({ category, onClick, categoryType = "place" }: CategoryCardProps) {
  const IconComponent = category.icon
    ? (LucideIcons as any)[category.icon]
    : LucideIcons.Music;

  const handleClick = () => {
    // Open player in new window - 1/6 크기로 축소 (16인치 노트북 기준)
    const params = new URLSearchParams({
      categoryId: category.id.toString(),
      categoryName: category.name,
      categoryImage: category.imageUrl || '',
      categoryType: categoryType,
    });
    window.open(`/player?${params.toString()}`, 'player', 'width=250,height=350,scrollbars=yes');
  };

  return (
    <Card
      onClick={handleClick}
      className="category-card cursor-pointer overflow-hidden border-none h-[200px] relative group"
    >
      {/* Background: Image or Gradient */}
      {category.imageUrl ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${category.imageUrl})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        </>
      ) : (
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${category.gradientFrom} 0%, ${category.gradientTo} 100%)`,
          }}
        />
      )}
      
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      <div className="relative h-full flex flex-col items-center justify-center text-white p-6 text-center">
        {(() => {
          const iconPath = getCategoryIcon(category.name, category.slug || undefined);
          
          // Always try to show custom icon first
          if (iconPath) {
            return (
              <img 
                src={iconPath} 
                alt={category.name}
                className="w-16 h-16 mb-4 object-contain"
                style={{ 
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                }}
                onError={(e) => {
                  console.error('Failed to load icon:', iconPath);
                  e.currentTarget.style.display = 'none';
                }}
              />
            );
          }
          
          // Fallback to Lucide icon
          return IconComponent ? 
            <IconComponent className="w-16 h-16 mb-4 drop-shadow-lg" strokeWidth={2.5} /> :
            <LucideIcons.Music className="w-16 h-16 mb-4 drop-shadow-lg" strokeWidth={2.5} />;
        })()}
        <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{category.name}</h3>
        {category.description && (
          <p className="text-sm opacity-90 drop-shadow-md">{category.description}</p>
        )}
      </div>
    </Card>
  );
}
