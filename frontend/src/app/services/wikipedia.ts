import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Wikipedia {
  private apiUrl = 'https://it.wikipedia.org/w/api.php';

  constructor(private http: HttpClient) {}

  getRandomArticleFromCategory(category: string): Observable<{ title: string; text: string }> {
    const listParams = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Categoria:${category}`,
      cmlimit: '50', 
      format: 'json',
      origin: '*'
    };

    return this.http.get<any>(this.apiUrl, { params: listParams }).pipe(
      switchMap(response => {
        const members = response.query?.categorymembers || [];
        
        if (members.length === 0) {
          throw new Error('Nessuna pagina trovata in questa categoria.');
        }

        const randomIndex = Math.floor(Math.random() * members.length);
        const randomPage = members[randomIndex];

        const contentParams = {
          action: 'query',
          prop: 'extracts',
          exintro: 'true', 
          explaintext: 'true',
          titles: randomPage.title,
          format: 'json',
          origin: '*'
        };

        return this.http.get<any>(this.apiUrl, { params: contentParams }).pipe(
          map(contentResponse => {
            const pages = contentResponse.query?.pages;
            const pageId = Object.keys(pages)[0];
            const pageData = pages[pageId];

            return {
              title: pageData.title,
              text: pageData.extract || ''
            };
          })
        );
      })
    );
  }
}
