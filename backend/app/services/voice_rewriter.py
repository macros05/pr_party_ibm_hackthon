"""
Voice rewriter service - uses Granite to add character personality to findings.
Each character has a unique voice and perspective.
"""
import re

from app.clients.watsonx_client import get_watsonx_client
from app.config import settings
from app.logging_config import get_logger
from app.models import CharacterId, Finding, FindingValidated

logger = get_logger(__name__)


# Character voice prompts
CHARACTER_VOICES = {
    "aegis": {
        "name": "Aegis, the Security Paladin",
        "personality": "Noble, vigilant, speaks in terms of threats and defenses. Uses medieval/fantasy metaphors.",
        "example": "This vulnerability is a breach in thy defenses! An attacker could exploit this weakness to infiltrate thy realm."
    },
    "schema": {
        "name": "Schema, the Database Mage",
        "personality": "Wise, analytical, speaks about data flow and optimization. Uses arcane/mystical metaphors.",
        "example": "The data flows inefficiently through these channels. I sense an N+1 query curse that will drain thy application's vitality."
    },
    "pixel": {
        "name": "Pixel, the UX Bard",
        "personality": "Artistic, empathetic, speaks about user experience and accessibility. Uses musical/artistic metaphors.",
        "example": "The contrast here creates a discordant note in the user's journey. Those with visual impairments will struggle to perceive this element."
    },
    "atlas": {
        "name": "Atlas, the Architecture Explorer",
        "personality": "Strategic, systematic, speaks about structure and patterns. Uses exploration/mapping metaphors.",
        "example": "I've charted these dependencies, and they form a tangled web. This coupling will make future navigation treacherous."
    },
    "echo": {
        "name": "Echo, the Test Priest",
        "personality": "Methodical, thorough, speaks about validation and edge cases. Uses ritual/ceremony metaphors.",
        "example": "This code path lacks the sacred rites of testing. What happens when the input is null? The ceremony is incomplete."
    },
    "codex": {
        "name": "Codex, the Docs Scribe",
        "personality": "Scholarly, precise, speaks about clarity and documentation. Uses library/manuscript metaphors.",
        "example": "The scrolls are silent on this function's purpose. Future scholars will struggle to decipher its intent without proper documentation."
    }
}


class VoiceRewriter:
    """Rewrites technical findings with character personality using Granite."""
    
    def __init__(self):
        self.watsonx = get_watsonx_client()
        logger.info("voice_rewriter_initialized")
    
    def _build_voice_prompt(
        self,
        character_id: CharacterId,
        finding: FindingValidated
    ) -> str:
        """Build prompt for Granite to rewrite finding in character's voice."""
        character = CHARACTER_VOICES[character_id]
        
        prompt = f"""You are {character['name']}.

Personality: {character['personality']}

Reference style (do not repeat this sentence): {character['example']}

Your task: Rewrite the following technical finding in your unique voice. Keep it concise (2-3 sentences max). Maintain the technical accuracy but add your personality. Respond with ONLY the rewritten comment as a single short paragraph — no quotation marks around it, no meta-commentary, no further examples, no offers to rewrite more findings, no questions, no follow-up.

Technical Finding:
Title: {finding.title}
Description: {finding.description}

Your voiced comment (2-3 sentences):"""

        return prompt
    
    async def rewrite_finding(
        self,
        character_id: CharacterId,
        finding: FindingValidated
    ) -> str:
        """
        Rewrite a finding in the character's voice using Granite.
        
        Args:
            character_id: Character to voice the finding
            finding: Technical finding to rewrite
        
        Returns:
            Character's voiced dialogue
        """
        logger.info(
            "voice_rewrite_start",
            character_id=character_id,
            finding_id=finding.id
        )
        
        prompt = self._build_voice_prompt(character_id, finding)

        try:
            dialogue = await self.watsonx.generate_text(
                model_id=settings.granite_model_id,
                prompt=prompt,
                max_tokens=150,
                temperature=0.8,
                # Primary defense: stop generation at the API level before the
                # model produces meta-commentary. Watsonx allows up to 6 stops.
                stop_sequences=[
                    "\n\n",
                    "\nTitle:",
                    "\nExample",
                    "\nHere",
                    "Example sounds",
                    "Your response should",
                ],
            )

            # Strip whitespace and surrounding quotes
            dialogue = dialogue.strip().strip('"').strip("'").strip()

            # Closing-quote continuation: the model often wraps its answer in
            # quotes and keeps writing on the SAME line — e.g.
            #   ...invasores." Example sounds good. Here are a few more...
            # Cut at the first sentence-ending punctuation followed by a
            # closing quote and a capitalized continuation, keeping the punct.
            quote_cut = re.search(r'([.!?])"\s+[A-Z]', dialogue)
            if quote_cut and quote_cut.start() >= 20:
                dialogue = dialogue[: quote_cut.start() + 1].strip()

            # Phrase-level continuations the model emits inline without a
            # newline. Keep the sentence punctuation that precedes the marker
            # when present.
            inline_phrases = [
                "Example sounds", "Example was",
                "Your response should",
                "Here's another", "Here is another",
                "Here's a new", "Here is a new",
                "Here are a few", "Here are more",
                "Here is the proposed", "Here is the rephrased",
                "Your turn", "your turn",
                "How was that", "Was that",
            ]
            for phrase in inline_phrases:
                idx = dialogue.find(phrase)
                if idx > 0:
                    head = dialogue[:idx].rstrip()
                    dialogue = head.rstrip('"').rstrip("'").rstrip()
                    break

            # Newline-prefixed markers (model starts a new line with meta).
            newline_markers = [
                "\nTitle:", "\nDescription:",
                "\nExample", "\nYour", "\nHere", "\nNow",
                "\nI,",  # model narrating itself: "I, Aegis..."
                "\n\n",
            ]
            for marker in newline_markers:
                idx = dialogue.find(marker)
                if idx > 0:
                    dialogue = dialogue[:idx].rstrip().rstrip('"').rstrip("'").rstrip()
                    break

            # Ensure it doesn't end mid-sentence — keep up to the last sentence-ending punctuation
            for punc in (".", "!", "?"):
                last = dialogue.rfind(punc)
                if last > len(dialogue) // 2:  # only trim if we keep most of the text
                    dialogue = dialogue[:last + 1]
                    break

            logger.info(
                "voice_rewrite_complete",
                character_id=character_id,
                finding_id=finding.id,
                dialogue_length=len(dialogue)
            )

            return dialogue
            
        except Exception as e:
            logger.error(
                "voice_rewrite_error",
                character_id=character_id,
                finding_id=finding.id,
                error=str(e)
            )
            # Fallback to technical description
            return finding.description
    
    async def rewrite_findings(
        self,
        classified_findings: dict[CharacterId, list[FindingValidated]]
    ) -> list[Finding]:
        """
        Rewrite all findings with character voices.
        
        Args:
            classified_findings: Findings grouped by character
        
        Returns:
            List of findings with character_dialogue added
        """
        voiced_findings: list[Finding] = []
        
        for character_id, findings in classified_findings.items():
            for finding in findings:
                # Rewrite in character's voice
                dialogue = await self.rewrite_finding(character_id, finding)
                
                # Create Finding with character assignment
                voiced_finding = Finding(
                    id=finding.id,
                    title=finding.title,
                    description=finding.description,
                    severity=finding.severity,
                    damage=finding.damage,
                    damage_type=finding.damage_type,
                    file_path=finding.file_path,
                    line_start=finding.line_start,
                    line_end=finding.line_end,
                    code_snippet=finding.code_snippet,
                    character_id=character_id,
                    character_dialogue=dialogue
                )
                
                voiced_findings.append(voiced_finding)
        
        logger.info(
            "all_findings_voiced",
            total_findings=len(voiced_findings)
        )
        
        return voiced_findings


# Global rewriter instance
_voice_rewriter: VoiceRewriter | None = None


def get_voice_rewriter() -> VoiceRewriter:
    """Get or create global voice rewriter instance."""
    global _voice_rewriter
    if _voice_rewriter is None:
        _voice_rewriter = VoiceRewriter()
    return _voice_rewriter

# Made with Bob
