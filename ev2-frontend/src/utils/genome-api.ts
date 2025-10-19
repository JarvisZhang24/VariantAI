export interface GenomeAssemblyFromSearch {
    id: string;
    name: string;
    sourceName: string;
    active: boolean;
    
}
export interface ChromosomeFromSearch {
    name: string;
    size: number;
}

export interface GeneFromSearch {
    name : string
    chrom: string;
    symbol: string;
    description: string;
    gene_id?: string;
}

export interface GeneDetailsFromSearch {
    genomicInfo?: {
      chromStart: number;
      chromEnd: number;
      strand?: string;
    }[];
    summary?: string;
    organism?: {
      scientificname: string;
      commonname: string;
    }
    
}

export interface GeneBounds {
    min: number;
    max: number;
}

export interface InitialRange {
    start: number;
    end: number;
}

export async function getAvailableGenomes() {
    const apiUrl = "https://api.genome.ucsc.edu/list/ucscGenomes"
    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error("Failed to fetch Data from UCSC API");
    }

    const genomeData = await response.json();
    if (!genomeData.ucscGenomes) {
        throw new Error("Failed to fetch Genomes from UCSC API");
    }

    const genomes = genomeData.ucscGenomes;

    const structuredGenomes: Record<string, GenomeAssemblyFromSearch[]> = {};

    for (const genomeId in genomes) {
        const genomeInfo = genomes[genomeId];
        const organism = genomeInfo.organism || "Other";


        if (!structuredGenomes[organism]) {
            structuredGenomes[organism] = [];
        }

        structuredGenomes[organism].push({
            id: genomeId,
            name: genomeInfo.description || genomeId,
            sourceName: genomeInfo.sourceName || genomeId,
            active: !!genomeInfo.active, // Convert 1 to true and 0 to false
        });
            

        
    }

    return {genomes:structuredGenomes};
}


export async function getGenomeChromosomes(genomeId: string) {
    const apiUrl = `https://api.genome.ucsc.edu/list/chromosomes?genome=${genomeId}` ;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error("Failed to fetch Chromosomes from UCSC API");
    }

    const chromosomesData = await response.json();
    if (!chromosomesData.chromosomes) {
        throw new Error("Missing Chromosomes Data");
    }

    const chromosomes: ChromosomeFromSearch[] = [];
    for (const chromosomeId in chromosomesData.chromosomes) {
        if (chromosomeId.includes("_") || chromosomeId.includes("Un") || chromosomeId.includes("random")) {
            continue;
        }

        chromosomes.push({
            name: chromosomeId,
            size: chromosomesData.chromosomes[chromosomeId],
        });
    }
    // sort chromosomes by perfix
    chromosomes.sort((a , b) => {
        const anum = a.name.replace("chr", "");
        const bnum = b.name.replace("chr", "");
        const isNumA = /^\d+$/.test(anum);
        const isNumB = /^\d+$/.test(bnum);
        if (isNumA && isNumB) {
            return Number(anum) - Number(bnum);
        }
        if (isNumA) {
            return -1;
        }
        if (isNumB) {
            return 1;
        }
        return a.name.localeCompare(b.name);
    })

    return {chromosomes};

}

export async function searchGenes(query: string, genome: string) {
  const url = "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search";
  const params = new URLSearchParams({
    terms: query,
    df: "chromosome,Symbol,description,map_location,type_of_gene",
    ef: "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID",
  });
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error("NCBI API Error");
  }

  const data = await response.json();
  const results: GeneFromSearch[] = [];

  if (data[0] > 0) {
    const fieldMap = data[2];
    const geneIds = fieldMap.GeneID || [];
    for (let i = 0; i < Math.min(10, data[0]); ++i) {
      if (i < data[3].length) {
        try {
          const display = data[3][i];
          let chrom = display[0];
          if (chrom && !chrom.startsWith("chr")) {
            chrom = `chr${chrom}`;
          }
          results.push({
            symbol: display[2],
            name: display[3],
            chrom,
            description: display[3],
            gene_id: geneIds[i] || "",
          });
        } catch {
          continue;
        }
      }
    }
  }

  return { query, genome, results };
}

export async function fetchGeneDetails(geneId: string)
: Promise<{
  geneDetails:GeneDetailsFromSearch | null;
  geneBound: GeneBounds | null;
  initialRange:{start:number; end:number} | null;
}> {

  try {
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
    const detailResponse = await fetch(detailUrl);

    if (!detailResponse.ok) {
      console.error("Failed to fetch gene details");
      return {
        geneDetails: null,
        geneBound: null,
        initialRange: null,
      };
    }
    const detailData = await detailResponse.json();

    if (detailData.result &&detailData.result[geneId]) {
      const detail = detailData.result[geneId];

      if(detail.genomicinfo && detail.genomicinfo.length > 0){
        const genomicInfo = detail.genomicinfo[0];

        const minPos = Math.min(genomicInfo.chrstart , genomicInfo.chrstop);
        const maxPos = Math.max(genomicInfo.chrstart , genomicInfo.chrstop);

        const bounds = {min : minPos , max : maxPos};

        const geneSize = maxPos - minPos;
        const seqStart = minPos;
        const seqEnd = geneSize > 10000? minPos + 10000 : maxPos;
        const initialRange = {start : seqStart , end : seqEnd};       
        
        return {
          geneDetails : detail,
          geneBound : bounds,
          initialRange : initialRange,
        }
        
      }

    }
    return {
      geneDetails: null,
      geneBound: null,
      initialRange: null,
      };
    
  } catch (err) {
    console.error("Failed to fetch gene details", err);
    return {
      geneDetails: null,
      geneBound: null,
      initialRange: null,
    };
    
  }
    
}

export async function fetchGeneSequence(chrom: string , genomeId: string , start: number , end: number)
: Promise<{
  sequence : string; 
  actualRange:{start:number; end:number};
  error? : string ;
 }> {

  try {
    
  const chromosome = chrom.startsWith("chr")? chrom: `chr${chrom}`;

  const apiStart = start - 1;
  const apiEnd = end ;

  const apiUrl = `https://api.genome.ucsc.edu/getData/sequence?genome=${genomeId}&chrom=${chromosome}&start=${apiStart}&end=${apiEnd}`;

  const response = await fetch(apiUrl);

  const data = await response.json();

  const actualRange = {start : data.start , end : data.end};

  if(data.error){
    return {
      sequence : "",
      actualRange : actualRange,
      error : data.error,
    };
  }

  const sequence = data.dna.toUpperCase();
  return {
    sequence : sequence,
    actualRange : actualRange,
  }

} catch (err) {
  console.error("Failed to fetch gene sequence", err);
  return {
    sequence : "",
    actualRange : {start : start , end : end},
    error : "Failed to fetch gene sequence",
  };
}
    
}


    

    