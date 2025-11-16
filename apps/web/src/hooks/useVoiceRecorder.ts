'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceRecorderOptions {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

/**
 * Custom hook for voice recording using Web Speech API
 * 
 * @example
 * ```tsx
 * const { isRecording, startRecording, stopRecording } = useVoiceRecorder({
 *   onResult: (text) => console.log(text),
 *   onError: (error) => console.error(error)
 * });
 * ```
 */
export function useVoiceRecorder({
  onResult,
  onError,
  language = 'en-US'
}: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimTranscriptRef = useRef<string>(''); // Store interim results
  const isInitializingRef = useRef<boolean>(false); // Prevent multiple simultaneous initializations

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Helper function to create a new recognition instance
  const createRecognitionInstance = useCallback(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true; // Enable interim results for real-time feedback
    recognition.lang = language;
    recognition.maxAlternatives = 1;
    return recognition;
  }, [language]);

  // Helper function to set up event handlers for a recognition instance
  const setupRecognitionHandlers = useCallback((recognition: SpeechRecognition) => {
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      interimTranscriptRef.current = ''; // Clear any previous interim results
      isInitializingRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Speech recognition result:', event);
      
      let finalTranscript = '';
      let interimTranscript = '';

      // Process ALL results from the beginning, not just from resultIndex
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          // Clear interim when we get final
          interimTranscriptRef.current = '';
        } else {
          interimTranscript += transcript + ' ';
          // Store interim for potential use on end
          interimTranscriptRef.current = interimTranscript.trim();
        }
      }

      // If we have final results, use them immediately
      if (finalTranscript.trim() && onResult) {
        console.log('Setting final transcript:', finalTranscript.trim());
        onResult(finalTranscript.trim());
      }
      // Note: We'll handle interim results in onend if no final results were received
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      setIsRecording(false);
      isInitializingRef.current = false;
      
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or access denied.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access in your browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          // User stopped recording, not an error
          console.log('Recording aborted by user');
          return;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended', { interim: interimTranscriptRef.current });
      isInitializingRef.current = false;
      
      // Use a small delay to ensure state is properly updated
      setTimeout(() => {
        setIsRecording(false);
        
        // If we have interim results but no final results were processed, use the interim
        // This handles cases where recognition stops before finalizing (e.g., user stops speaking)
        if (interimTranscriptRef.current && onResult) {
          console.log('Using interim transcript on end:', interimTranscriptRef.current);
          onResult(interimTranscriptRef.current);
          interimTranscriptRef.current = ''; // Clear after using
        }
      }, 50);
    };

    recognition.onnomatch = () => {
      console.log('No speech match found');
      isInitializingRef.current = false;
      if (onError) {
        onError('No speech match found. Please try speaking again.');
      }
    };
  }, [onResult, onError]);

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const recognition = createRecognitionInstance();
    if (!recognition) return;

    setupRecognitionHandlers(recognition);
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [isSupported, createRecognitionInstance, setupRecognitionHandlers]);

  const startRecording = useCallback(() => {
    console.log('Attempting to start recording...', { 
      isSupported, 
      hasRecognition: !!recognitionRef.current,
      isRecording,
      isInitializing: isInitializingRef.current
    });
    
    if (!isSupported) {
      if (onError) {
        onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
      return;
    }

    // Prevent multiple simultaneous start attempts
    if (isInitializingRef.current) {
      console.log('Already initializing, skipping...');
      return;
    }

    // If already recording, stop first and wait
    if (isRecording) {
      console.log('Already recording, stopping first...');
      try {
        recognitionRef.current?.stop();
        // Wait for recognition to fully stop before starting again
        setTimeout(() => {
          startRecording();
        }, 500);
      } catch (e) {
        console.error('Error stopping existing recognition:', e);
      }
      return;
    }

    // Ensure we're not in a recording state
    setIsRecording(false);
    interimTranscriptRef.current = '';

    // Small delay to ensure any previous recognition has fully ended
    setTimeout(() => {
      isInitializingRef.current = true;
      
      try {
        // Check if recognition instance is valid, recreate if needed
        if (!recognitionRef.current) {
          console.log('Recreating recognition instance...');
          const newRecognition = createRecognitionInstance();
          if (newRecognition) {
            // Set up event handlers for new instance
            setupRecognitionHandlers(newRecognition);
            recognitionRef.current = newRecognition;
          } else {
            if (onError) {
              onError('Failed to initialize speech recognition. Please refresh the page.');
            }
            isInitializingRef.current = false;
            return;
          }
        }

        recognitionRef.current.start();
        console.log('Recording started successfully');
        isInitializingRef.current = false;
      } catch (error: any) {
        console.error('Error starting recognition:', error);
        isInitializingRef.current = false;
        
        // If recognition is in invalid state, recreate the instance
        if (error.name === 'InvalidStateError' || error.message?.includes('already started')) {
          console.log('Recognition in invalid state, recreating instance...');
          try {
            // Clean up old instance
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                // Ignore stop errors
              }
              recognitionRef.current = null;
            }
            
            // Wait before creating new instance
            setTimeout(() => {
              const newRecognition = createRecognitionInstance();
              if (newRecognition) {
                setupRecognitionHandlers(newRecognition);
                recognitionRef.current = newRecognition;
                
                // Try starting again after a short delay
                setTimeout(() => {
                  try {
                    recognitionRef.current?.start();
                    console.log('Recording started after recreating instance');
                  } catch (retryError: any) {
                    console.error('Error on retry after recreation:', retryError);
                    setIsRecording(false);
                    if (onError) {
                      onError('Failed to start recording. Please wait a moment and try again.');
                    }
                  }
                }, 200);
              } else {
                setIsRecording(false);
                if (onError) {
                  onError('Failed to recreate speech recognition. Please refresh the page.');
                }
              }
            }, 300);
          } catch (resetError) {
            console.error('Error recreating recognition:', resetError);
            setIsRecording(false);
            if (onError) {
              onError('Failed to start recording. Please refresh the page.');
            }
          }
        } else {
          setIsRecording(false);
          if (onError) {
            onError(`Failed to start recording: ${error.message || 'Unknown error'}. Please check your microphone permissions.`);
          }
        }
      }
    }, 100);
  }, [isSupported, isRecording, onError, createRecognitionInstance, setupRecognitionHandlers]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...', { isRecording, hasRecognition: !!recognitionRef.current });
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Recording stopped successfully');
      } catch (error) {
        console.error('Error stopping recognition:', error);
        // Force set to false even if stop fails
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
    // Note: onend will also set isRecording to false, but we set it here too for immediate feedback
  }, [isRecording]);

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
  };
}

