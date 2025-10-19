"use client";


import { fetchGeneDetails, type GeneBounds, type GeneDetailsFromSearch, type GeneFromSearch } from "~/utils/genome-api";
import { Button } from "./ui/button";
import { ArrowBigLeft } from "lucide-react";
import { useEffect, useState } from "react";


export default function GeneViewer({ 
    gene, 
    genomeId, 
    onClose 
} : {
    gene:GeneFromSearch, 
    genomeId:string, 
    onClose:() => void
}) {


    const [geneDetails , setGeneDetails] = useState<GeneDetailsFromSearch | null>(null);
    const [geneBound , setGeneBound] = useState<GeneBounds | null>(null);
    const [startPosition , setStartPosition] = useState<string>("");
    const [endPosition , setEndPosition] = useState<string>("");

    const [isLoading , setIsLoading] = useState(false);
    const [error , setError] = useState<string | null>(null);


    useEffect(() => {
        const initialGeneData = async () => {
            setIsLoading(true);
            setError(null);
            setGeneDetails(null);
            setGeneBound(null);
            setStartPosition("");
            setEndPosition("");
            
            if(!gene.gene_id){
                setError("Gene ID not found");
                setIsLoading(false);
                return;
            }

            try {
                const {geneDetails , geneBound , initialRange} = await fetchGeneDetails(gene.gene_id);

                setGeneDetails(geneDetails);
                setGeneBound(geneBound);
                
                if(initialRange){
                    setStartPosition(initialRange.start.toString());
                    setEndPosition(initialRange.end.toString());
                    // fetch gene sequence
                    
                }

                
            } catch (error) {
                setError("Failed to fetch gene details, please try again later");
            } finally {
                setIsLoading(false);
            }

            
        }

        initialGeneData();

        
    }, [gene , genomeId])




    return (
        <div className="space-y-6">
            <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer text-[#3c4f3d] hover:bg-[#e9eeea]/70"
            onClick={onClose}>
                <ArrowBigLeft className="mr-2 h-6 w-4"/>
                Back to Results
            </Button>
            
            
        </div>
    )

}
    