"use client";


import { 
    fetchGeneDetails, 
    type GeneBounds, 
    type GeneDetailsFromSearch, 
    type GeneFromSearch,
    fetchGeneSequence as apiFetchGeneSequence
    
} from "~/utils/genome-api";
import { Button } from "./ui/button";
import { ArrowBigLeft } from "lucide-react";
import { useEffect, useState , useCallback } from "react";
import GeneInformation from "./gene-information";


export default function GeneViewer({ 
    gene, 
    genomeId, 
    onClose 
} : {
    gene:GeneFromSearch, 
    genomeId:string, 
    onClose:() => void
}) {

    const [geneSequence , setGeneSequence] = useState<string>("");
    const [geneDetails , setGeneDetails] = useState<GeneDetailsFromSearch | null>(null);
    const [geneBound , setGeneBound] = useState<GeneBounds | null>(null);
    const [startPosition , setStartPosition] = useState<string>("");
    const [endPosition , setEndPosition] = useState<string>("");

    const [isLoading , setIsLoading] = useState(false);
    const [error , setError] = useState<string | null>(null);
    const [isLoadingSequence , setIsLoadingSequence] = useState(false);

    const [actualRange , setActualRange] = useState<{start:number; end:number} | null>(null);


    const fetchGeneSequence = useCallback(
        async (start: number , end: number) => {

        try {
            setIsLoadingSequence(true);
            setError(null);

            const {sequence , actualRange:fetchedActualRange, error } = await apiFetchGeneSequence(gene.chrom , genomeId , start , end);
            setGeneSequence(sequence);
            setActualRange(fetchedActualRange);

            if(error){
                setError(error);
            }

            
            
            
            
        } catch (error) {
            setError("Failed to fetch gene sequence, please try again later");
        } finally {
            setIsLoadingSequence(false);
        }


    },[gene.chrom , genomeId])


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
                const {geneDetails: fetchedGeneDetails , geneBound: fetchedGeneBound , initialRange: fetchedInitialRange} = await fetchGeneDetails(gene.gene_id);

                setGeneDetails(fetchedGeneDetails);
                setGeneBound(fetchedGeneBound);
                
                if(fetchedInitialRange){
                    setStartPosition(fetchedInitialRange.start.toString());
                    setEndPosition(fetchedInitialRange.end.toString());
                    // fetch gene sequence
                    await fetchGeneSequence(fetchedInitialRange.start , fetchedInitialRange.end);
                    //console.log(fetchedGeneDetails);
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


            <GeneInformation
            gene={gene}
            geneDetail={geneDetails}
            geneBounds={geneBound}
            />
            
            
        </div>
    )

}
    