import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState(() => {
    const postsWithDateFormatted: Post[] = postsPagination.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: post.data,
      };
    });

    return postsWithDateFormatted;
  });

  async function handleShowMorePosts(): Promise<void> {
    const response = await fetch(nextPage)
      .then(res => res.json())
      .then(result => {
        const newPosts: Post[] = result.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: post.data,
          };
        });
        const postsWithDateFormatted: Post[] = newPosts.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date.replace(
              'abr',
              'Abr'
            ),
            data: post.data,
          };
        });

        const { next_page } = result;

        const postPagination: PostPagination = {
          next_page,
          results: postsWithDateFormatted,
        };
        return postPagination;
      });

    if (response) {
      setPosts([...posts, ...response.results]);
      setNextPage(response.next_page);
    }
  }

  return (
    <>
      <Head>
        <title>Início | spacetravelling</title>
      </Head>
      <main className={styles.container}>
        <Header />

        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={styles.postInfo}>
                <div className={styles.info}>
                  <img src="/images/calendar.svg" alt="calendar" />
                  <p>{post.first_publication_date}</p>
                </div>
                <div className={styles.info}>
                  <img src="/images/user.svg" alt="user" />
                  <p>{post.data.author}</p>
                </div>
              </div>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button type="button" onClick={handleShowMorePosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.slug'],
      pageSize: 1,
    }
  );

  // const results = postsResponse.results.map(post => {
  //   return {
  //     uid: post.uid,
  //     first_publication_date: format(
  //       new Date(post.first_publication_date),
  //       'dd MMM yyyy',
  //       {
  //         locale: ptBR,
  //       }
  //     ),
  //     data: post.data,
  //   };
  // });

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: post.data,
    };
  });

  const { next_page } = postsResponse;
  const postsPagination = {
    results,
    next_page,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 1,
  };
};
