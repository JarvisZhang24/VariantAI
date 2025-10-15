"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  type GenomeAssemblyFromSearch,
  type ChromosomeFromSearch,
  getAvailableGenomes,
  getGenomeChromosomes, 
  type GeneFromSearch,
  searchGenes

} from "../utils/genome-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Value } from "@radix-ui/react-select";
import { Search, Table } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";


type Mode = "browse" | "search";

export default function HomePage() {

  const [genomes , setGenomes] = useState<GenomeAssemblyFromSearch[]>([]);
  const [selectedGenome , setSelectedGenome] = useState<string>("hg38");

  const [chromosomes , setChromosomes] = useState<ChromosomeFromSearch[]>([]);
  const [selectedChromosome , setSelectedChromosome] = useState<string>("chr1");
  const [searchQuery , setSearchQuery] = useState<string>("");
  const [searchResults , setSearchResults] = useState<GeneFromSearch[]>([]);

  const [isLoading , setIsLoading] = useState(false);

  const [error , setError] = useState<string | null>(null);

  const [mode , setMode] = useState<Mode>("browse");


  useEffect(() => {
    const fetchGenomes = async () => {

      try {
        setIsLoading(true);
        const data = await getAvailableGenomes();
        if (data.genomes && data.genomes["Human"]){
          setGenomes(data.genomes["Human"]);  
        }
      } catch (error) {
        setError("Failed to fetch genomes");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGenomes();
  }, [])

  useEffect(() => {
    const fetchChromosomes = async () => {

      try {
        setIsLoading(true);
        const data = await getGenomeChromosomes(selectedGenome);
        setChromosomes(data.chromosomes);
        console.log(data.chromosomes);
        if (data.chromosomes.length > 0){
          setSelectedChromosome(data.chromosomes[0]!.name);
          
        }
      } catch (error) {
        setError("Failed to load chromosomes");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChromosomes();
  }, [selectedGenome])

  const performGeneSearch = async (query: string, genome: string,filterFn?:((gene:GeneFromSearch)=>boolean),) => {
    try {
        setIsLoading(true);
        const data = await searchGenes(query, genome);
        const results = filterFn? data.results.filter(filterFn):data.results;
        
        console.log(results);
        
        setSearchResults(results);
    } catch (error) {
      setError("Failed to search Genes");
    } finally {
      setIsLoading(false);
    }
    
  }

  useEffect(() => {
    if(!selectedChromosome || mode !== "browse") return;
    performGeneSearch(selectedChromosome, selectedGenome , (gene:GeneFromSearch) => gene.chrom === selectedChromosome);

  }, [selectedChromosome , selectedGenome, mode]);

  const handleGenomeChange = (value: string) => {
    setSelectedGenome(value);
  }

  const handleChromosomeChange = (value: string) => {
    setSelectedChromosome(value);
  }

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) {
      return;
    }
    setSearchResults([]);
    setError(null);
    if(newMode === "browse" && selectedChromosome){
      performGeneSearch(selectedChromosome, selectedGenome , (gene:GeneFromSearch) => gene.chrom === selectedChromosome);
    }
    setMode(newMode);
  }

  const loadBRCA1Example = () => {
    setMode("search");
    setSearchQuery("BRCA1");
    // handle search
    handleSearch();
    
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    performGeneSearch(searchQuery, selectedGenome);   
    
  };
  
  return (
    <div className="min-h-screen bg-[#e9eeea]"> 
        <header className="border-b border-[#3c4f3d]/10 bg-white">  
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <h1 className="text-2xl font-bold text-[#3c4f3d]">Variant Analysis</h1>
                  <p className="text-sm text-[#3c4f3d]/60"> Genetic variant analysis using Ev2 Model </p>
                </div>
                <span className="text-sm text-[#3c4f3d]/60">jarviszhang.ai@gmail.com </span>
              </div>
              
            </div>


      

        </header>

        <main className="container mx-auto px-6 py-6">  
        <Card className="mb-6 gap-0 border-none bg-white py-0 shadow-sm">
              <CardHeader className="pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-normal text-[#3c4f3d]/70">
                    Genome Assembly
                  </CardTitle>
                  <div className="text-xs text-[#3c4f3d]/60">
                    Organism: <span className="font-medium">Human</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <Select value={selectedGenome} 
                onValueChange={handleGenomeChange}
                disabled={isLoading}
                >
                  <SelectTrigger className="h-9 w-full border-[#3c4f3d]/10">
                    <SelectValue placeholder="Select a genome" />
                  </SelectTrigger>
                  <SelectContent>
                    {genomes.map((genome) => (
                      <SelectItem key={genome.id} value={genome.id}>
                        {genome.id} - {genome.name}

                        {genome.active ? " (Active)" : "(Not Active)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  
                </Select>
                {
                  selectedGenome && (
                  <p className="mt-2 text-xs text-[#3c4f3d]/60">
                    Source Name: {
                    genomes.find((genome) => genome.id === selectedGenome)?.sourceName
                  }
                  </p>
                  )
                }
                
              </CardContent>
            </Card>

            <Card className="mb-6 gap-0 border-none bg-white py-0 shadow-sm">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="text-sm font-normal text-[#3c4f3d]/70">Chromosome</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)}> 
                <TabsList className="mb-4 bg-[#e9eeea]">
                    <TabsTrigger
                      className="data-[state=active]:bg-white data-[state=active]:text-[#3c4f3d]"
                      value="search"
                    >
                      Search Genes
                    </TabsTrigger>
                    <TabsTrigger
                      className="data-[state=active]:bg-white data-[state=active]:text-[#3c4f3d]"
                      value="browse"
                    >
                      Browse Chromosomes
                    </TabsTrigger>
                  </TabsList>
                <TabsContent value="search" className="mt-0">
                  <div className="space-y-4">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col gap-3 sm:flex-row"
                      >
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            placeholder="Enter gene symbol or name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 border-[#3c4f3d]/10 pr-10"
                          />
                          <Button
                            type="submit"
                            className="absolute top-0 right-0 h-full cursor-pointer rounded-l-none bg-[#3c4f3d] text-white hover:bg-[#3c4f3d]/90"
                            size="icon"
                            disabled={isLoading || !searchQuery.trim()}
                          >
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Search</span>
                          </Button>
                        </div>
                      </form>

                      <Button
                        variant="link"
                        className="h-auto cursor-pointer p-0 text-[#de8246] hover:text-[#de8246]/80"
                        onClick={loadBRCA1Example}
                      >
                        Try BRCA1 example
                      </Button>
                    
                  </div>
                </TabsContent>

                <TabsContent value="browse" className="mt-0">
                    <div className="max-h-[150px] overflow-y-auto pr-1">
                      <div className="flex flex-wrap gap-2">
                        {chromosomes.map((chrom) => (
                          <Button
                            key={chrom.name}
                            variant="outline"
                            size="sm"
                            className={`h-8 cursor-pointer border-[#3c4f3d]/10 hover:bg-[#e9eeea] hover:text-[#3c4f3d] ${selectedChromosome === chrom.name ? "text[#3c4f3d] bg-[#e9eeea]" : ""}`}
                            onClick={() => setSelectedChromosome(chrom.name)}
                          >
                            {chrom.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                </Tabs>

                {isLoading && (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3c4f3d]/30 border-t-[#de8243]"></div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </CardContent>

              
            </Card>
          
        </main>
      
    </div>
  );
}
