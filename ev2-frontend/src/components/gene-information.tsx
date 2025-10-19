import { type GeneBounds, type GeneDetailsFromSearch, type GeneFromSearch } from "~/utils/genome-api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ExternalLink, Dna } from "lucide-react";

export default function GeneInformation({
    gene,
    geneDetail,
    geneBounds,
}: {
    gene: GeneFromSearch;
    geneDetail: GeneDetailsFromSearch | null;
    geneBounds: GeneBounds | null;
}) {
    // 计算基因长度
    const geneLength = geneBounds 
        ? Math.abs(geneBounds.max - geneBounds.min + 1)
        : null;

    // 判断是否在反向链
    const isReverseStrand = geneDetail?.genomicInfo?.[0]?.strand === "-";

    return (
        <Card className="border-none bg-white shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Dna className="h-5 w-5 text-[#3c4f3d]" />
                    <CardTitle className="text-lg font-semibold text-[#3c4f3d]">
                        Gene Information
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 基本信息区域 */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* 左列：基因基本信息 */}
                    <div className="space-y-3">
                        <h3 className="mb-3 text-sm font-semibold text-[#3c4f3d]">
                            Basic Information
                        </h3>

                        <InfoRow label="Symbol" value={gene.symbol} highlight />
                        <InfoRow label="Name" value={gene.name} />
                        
                        {gene.description && gene.description !== gene.name && (
                            <InfoRow label="Description" value={gene.description} />
                        )}

                        <InfoRow label="Chromosome" value={gene.chrom} />

                        {geneBounds && (
                            <>
                                <InfoRow 
                                    label="Position" 
                                    value={
                                        <span className="font-mono">
                                            {Math.min(geneBounds.min, geneBounds.max).toLocaleString()} - {Math.max(geneBounds.min, geneBounds.max).toLocaleString()}
                                            {isReverseStrand && (
                                                <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                                                    Reverse
                                                </span>
                                            )}
                                        </span>
                                    } 
                                />
                                <InfoRow 
                                    label="Length" 
                                    value={`${geneLength?.toLocaleString()} bp`}
                                />
                            </>
                        )}
                    </div>

                    {/* 右列：外部链接和生物体信息 */}
                    <div className="space-y-3">
                        <h3 className="mb-3 text-sm font-semibold text-[#3c4f3d]">
                            References
                        </h3>

                        {gene.gene_id && (
                            <InfoRow 
                                label="Gene ID" 
                                value={
                                    <a
                                        href={`https://www.ncbi.nlm.nih.gov/gene/${gene.gene_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                                    >
                                        <span className="font-mono">{gene.gene_id}</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                }
                            />
                        )}

                        {geneDetail?.organism && (
                            <InfoRow 
                                label="Organism" 
                                value={
                                    <span>
                                        <span className="italic">{geneDetail.organism.scientificname}</span>
                                        {geneDetail.organism.commonname && (
                                            <span className="ml-1 text-[#3c4f3d]/60">
                                                ({geneDetail.organism.commonname})
                                            </span>
                                        )}
                                    </span>
                                }
                            />
                        )}

                        {!geneDetail && (
                            <div className="flex items-center gap-2 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                Loading additional details...
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary 区域 - 全宽 */}
                {geneDetail?.summary && (
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="mb-2 text-sm font-semibold text-[#3c4f3d]">
                            Summary
                        </h3>
                        <p className="text-sm leading-relaxed text-[#3c4f3d]/80">
                            {geneDetail.summary}
                        </p>
                    </div>
                )}
            </CardContent>


        </Card>
    );
}

// 辅助组件：信息行
function InfoRow({ 
    label, 
    value, 
    highlight = false 
}: { 
    label: string; 
    value: React.ReactNode; 
    highlight?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="min-w-[100px] text-xs font-medium text-[#3c4f3d]/70">
                {label}:
            </span>
            <span className={`flex-1 text-sm ${
                highlight 
                    ? "font-semibold text-[#3c4f3d]" 
                    : "text-[#3c4f3d]/90"
            }`}>
                {value || <span className="text-gray-400">N/A</span>}
            </span>
        </div>
    );
}